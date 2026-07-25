package app.skate.tracker;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.PowerManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayDeque;

// Surface-roughness sampling that survives the screen turning off. The web
// devicemotion event stops the moment the WebView sleeps, which left GPS
// routes with almost no vibration data on real skates. SensorManager plus a
// partial wake lock keeps the accelerometer flowing for the whole session;
// JS drains the buffer once per GPS fix so each route segment gets the RMS
// of exactly the pavement it covered.
@CapacitorPlugin(name = "Roughness")
public class RoughnessPlugin extends Plugin implements SensorEventListener {
    private SensorManager sensors;
    private Sensor sensor;
    private Sensor pressureSensor; // barometer — fine-grained elevation
    private boolean linear; // TYPE_LINEAR_ACCELERATION (gravity already removed)
    private PowerManager.WakeLock lock;

    // Sums since the last read; guarded by `this`.
    private double sumSq = 0;
    private int count = 0;
    private double pressureSum = 0; // hPa
    private int pressureCount = 0;

    // Timestamped per-second RMS series — the record that survives the screen
    // sleeping. With the display off the WebView throttles the plugin bridge:
    // read() promises stop resolving, so the JS side carries its last RMS onto
    // every GPS fix (real rides came back with one value repeated for 50+
    // minutes) while the true vibration was lost. Bucketing every sample here,
    // keyed by wall clock, lets JS backfill the entire ride at save time —
    // when the screen is on and the bridge works. Guarded by `this`.
    private static final int SERIES_CAP = 6 * 60 * 60; // six hours of seconds
    private final ArrayDeque<double[]> series = new ArrayDeque<>(); // {epochMs, sumSq, count}
    private long bucketStart = 0;
    private double bucketSumSq = 0;
    private int bucketCount = 0;

    // Prefer the wake-up variant: Pixels (and others) suspend non-wake-up
    // sensors when the screen turns off even while a partial wake lock holds
    // the CPU — which froze mid-skate roughness data at the last seen value.
    private Sensor pick(int type) {
        Sensor s = sensors.getDefaultSensor(type, true);
        return s != null ? s : sensors.getDefaultSensor(type);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (sensors == null) {
            sensors = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        }
        stopSampling();
        // Wake-up capability trumps sensor quality. The Pixel 7 has no wake-up
        // variant of the linear-acceleration sensor, so preferring linear left
        // rides ~85% unsampled — the sensor suspended whenever the screen
        // slept. A wake-up raw accelerometer keeps flowing pocket-carried all
        // ride; gravity removal by magnitude is slightly noisier, but data
        // beats a blind spot.
        Sensor wakeLinear = sensors.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION, true);
        Sensor wakeRaw = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER, true);
        if (wakeLinear != null) {
            sensor = wakeLinear;
            linear = true;
        } else if (wakeRaw != null) {
            sensor = wakeRaw;
            linear = false;
        } else {
            sensor = sensors.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
            linear = sensor != null;
            if (sensor == null) sensor = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
        if (sensor == null) {
            call.reject("No accelerometer on this device");
            return;
        }
        sensors.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
        // Barometer, when the device has one: pressure resolves elevation to
        // ~0.3 m where GPS altitude wobbles by ±10 m. Optional — read() just
        // reports no pressure on devices without it.
        pressureSensor = pick(Sensor.TYPE_PRESSURE);
        if (pressureSensor != null) {
            sensors.registerListener(this, pressureSensor, SensorManager.SENSOR_DELAY_UI);
        }
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        lock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "skate:roughness");
        // Timed as a leak backstop — released properly when the session ends.
        lock.acquire(6 * 60 * 60 * 1000L);
        synchronized (this) {
            sumSq = 0;
            count = 0;
            pressureSum = 0;
            pressureCount = 0;
            series.clear();
            bucketStart = 0;
            bucketSumSq = 0;
            bucketCount = 0;
        }
        JSObject ret = new JSObject();
        ret.put("sensor", sensor.getName());
        ret.put("wakeUp", sensor.isWakeUpSensor());
        ret.put("linear", linear);
        ret.put("barometer", pressureSensor != null ? pressureSensor.getName() : null);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopSampling();
        call.resolve();
    }

    // Everything sensed since the previous read, then reset: vibration RMS
    // (m/s²) and mean barometric pressure (hPa; -1 when no barometer).
    @PluginMethod
    public void read(PluginCall call) {
        double rms;
        int n;
        double pressure;
        int pn;
        synchronized (this) {
            n = count;
            rms = n > 0 ? Math.sqrt(sumSq / n) : -1;
            sumSq = 0;
            count = 0;
            pn = pressureCount;
            pressure = pn > 0 ? pressureSum / pn : -1;
            pressureSum = 0;
            pressureCount = 0;
        }
        JSObject ret = new JSObject();
        ret.put("rms", rms);
        ret.put("samples", n);
        ret.put("pressure", pressure);
        ret.put("pressureSamples", pn);
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        if (e.sensor.getType() == Sensor.TYPE_PRESSURE) {
            synchronized (this) {
                if (pressureCount < 200_000) { pressureSum += e.values[0]; pressureCount++; }
            }
            return;
        }
        float x = e.values[0], y = e.values[1], z = e.values[2];
        double mag = Math.sqrt(x * x + y * y + z * z);
        if (!linear) mag = Math.abs(mag - 9.81);
        synchronized (this) {
            // ~50 Hz; the cap only matters if JS stops draining (long pause).
            if (count < 200_000) { sumSq += mag * mag; count++; }
            long sec = System.currentTimeMillis() / 1000L * 1000L;
            if (sec != bucketStart) {
                flushBucket();
                bucketStart = sec;
            }
            bucketSumSq += mag * mag;
            bucketCount++;
        }
    }

    // Push the in-progress second onto the series. Caller holds `this`.
    private void flushBucket() {
        if (bucketCount > 0) {
            series.addLast(new double[] { bucketStart, bucketSumSq, bucketCount });
            while (series.size() > SERIES_CAP) series.removeFirst();
        }
        bucketSumSq = 0;
        bucketCount = 0;
    }

    // The whole timestamped series since `since` (epoch ms). Called once at
    // session save, screen on — this is where a ride's roughness truly comes
    // from; the per-fix read() path is only the live chip and a fallback.
    @PluginMethod
    public void readSeries(PluginCall call) {
        double since = call.getDouble("since", 0.0);
        JSArray entries = new JSArray();
        synchronized (this) {
            flushBucket();
            bucketStart = 0;
            for (double[] b : series) {
                if (b[0] < since) continue;
                JSObject entry = new JSObject();
                entry.put("t", (long) b[0]);
                entry.put("r", Math.round(Math.sqrt(b[1] / b[2]) * 100.0) / 100.0);
                entry.put("n", (int) b[2]);
                entries.put(entry);
            }
        }
        JSObject ret = new JSObject();
        ret.put("entries", entries);
        call.resolve(ret);
    }

    @Override
    public void onAccuracyChanged(Sensor s, int accuracy) { }

    private void stopSampling() {
        if (sensors != null) sensors.unregisterListener(this);
        if (lock != null && lock.isHeld()) lock.release();
        lock = null;
    }

    @Override
    protected void handleOnDestroy() {
        stopSampling();
    }
}
