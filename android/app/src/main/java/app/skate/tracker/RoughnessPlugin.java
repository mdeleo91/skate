package app.skate.tracker;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.PowerManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
    private boolean linear; // TYPE_LINEAR_ACCELERATION (gravity already removed)
    private PowerManager.WakeLock lock;

    // Sum of squared magnitudes + count since the last read; guarded by `this`.
    private double sumSq = 0;
    private int count = 0;

    @PluginMethod
    public void start(PluginCall call) {
        if (sensors == null) {
            sensors = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        }
        stopSampling();
        sensor = sensors.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
        linear = sensor != null;
        if (sensor == null) sensor = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (sensor == null) {
            call.reject("No accelerometer on this device");
            return;
        }
        sensors.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        lock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "skate:roughness");
        // Timed as a leak backstop — released properly when the session ends.
        lock.acquire(6 * 60 * 60 * 1000L);
        synchronized (this) { sumSq = 0; count = 0; }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopSampling();
        call.resolve();
    }

    // RMS (m/s²) of everything sensed since the previous read, then reset.
    @PluginMethod
    public void read(PluginCall call) {
        double rms;
        int n;
        synchronized (this) {
            n = count;
            rms = n > 0 ? Math.sqrt(sumSq / n) : -1;
            sumSq = 0;
            count = 0;
        }
        JSObject ret = new JSObject();
        ret.put("rms", rms);
        ret.put("samples", n);
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        float x = e.values[0], y = e.values[1], z = e.values[2];
        double mag = Math.sqrt(x * x + y * y + z * z);
        if (!linear) mag = Math.abs(mag - 9.81);
        synchronized (this) {
            // ~50 Hz; the cap only matters if JS stops draining (long pause).
            if (count < 200_000) { sumSq += mag * mag; count++; }
        }
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
