package cn.toside.music.mobile;

import android.util.Log;

import com.reactnativenavigation.NavigationActivity;
import com.reactnativenavigation.NavigationApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;

public class MainActivity extends NavigationActivity {

    private static final String TAG = "MainActivity";

    /**
     * RNN v7 的 invokeDefaultOnBackPressed() 在 navigator.handleBack() 返回 false 时，
     * 会临时禁用 JS BackHandler callback 然后直接 finish activity，导致根 stack 上的
     * JS BackHandler（比如"在歌单页才退出"的逻辑）被跳过。
     *
     * 这里重写 invokeDefaultOnBackPressed，在 RNN finish 之前先手动调一次
     * ReactInstanceManager.onBackPressed()（返回 boolean），让 JS BackHandler 有机会拦截。
     * 如果 JS 返回 true，就跳过默认 finish 行为。
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        try {
            NavigationApplication app = (NavigationApplication) getApplication();
            ReactNativeHost nativeHost = app.getReactNativeHost();
            if (nativeHost != null && nativeHost.hasInstance()) {
                ReactInstanceManager manager = nativeHost.getReactInstanceManager();
                if (manager != null && manager.onBackPressed()) {
                    // JS BackHandler 里有人返回了 true → 拦截住了，不 finish
                    Log.d(TAG, "JS BackHandler handled back, skipping default finish");
                    return;
                }
            }
        } catch (Throwable t) {
            Log.w(TAG, "Failed to dispatch back to JS BackHandler, proceeding with default", t);
        }
        // 走 RNN 原来的默认行为（finish activity）
        super.invokeDefaultOnBackPressed();
    }

}
