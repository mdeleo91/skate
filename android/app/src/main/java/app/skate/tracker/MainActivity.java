package app.skate.tracker;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // A WebView cannot save files — without this, tapping a download link
        // (like an APK update) silently does nothing. Hand any download off to
        // the system browser, which has a real download manager.
        this.bridge.getWebView().setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        });
    }
}
