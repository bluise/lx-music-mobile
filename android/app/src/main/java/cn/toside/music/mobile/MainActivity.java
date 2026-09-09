package cn.toside.music.mobile;

import android.util.Log;

import com.reactnativenavigation.NavigationActivity;

public class MainActivity extends NavigationActivity {

    private static final String TAG = "MainActivity";

    /**
     * JS BackHandler 全返回 false 后，RN DeviceEventManager 会调这个方法。
     * 在这里加 log 看是不是走到了这一步。
     */
    @Override
    public void invokeDefaultOnBackPressed() {
        Log.d(TAG, "invokeDefaultOnBackPressed — JS BackHandler did NOT intercept, will finish activity");
        super.invokeDefaultOnBackPressed();
    }
}
