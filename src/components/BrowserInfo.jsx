import { useState, useEffect } from 'react';

const BrowserInfo = () => {
  const [info, setInfo] = useState({});

  useEffect(() => {
    const getBrowserInfo = () => {
      const ua = navigator.userAgent;
      const browser = (() => {
        if (/chrome|crios|crmo/i.test(ua)) return 'Chrome';
        if (/firefox|fxios/i.test(ua)) return 'Firefox';
        if (/safari/i.test(ua)) return 'Safari';
        if (/msie|trident/i.test(ua)) return 'IE';
        if (/edg/i.test(ua)) return 'Edge';
        return 'Unknown';
      })();
      return { userAgent: ua, browser };
    };

    const getOSInfo = () => {
      const platform = navigator.platform;
      const os = (() => {
        if (/win/i.test(platform)) return 'Windows';
        if (/mac/i.test(platform)) return 'MacOS';
        if (/linux/i.test(platform)) return 'Linux';
        if (/android/i.test(platform)) return 'Android';
        if (/iphone|ipad|ipod/i.test(platform)) return 'iOS';
        return 'Unknown';
      })();
      return { platform, os };
    };

    const getScreenInfo = () => ({
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    });

    const getCPUInfo = () => {
      const platform = navigator.platform;
      const architecture = /x64/i.test(platform) ? '64-bit' : '32-bit';
      return { platform, architecture };
    };

    const getMemoryInfo = () => ({
      deviceMemory: navigator.deviceMemory || 'Unknown',
    });

    const getCPUCoreInfo = () => ({
      cores: navigator.hardwareConcurrency || 'Unknown',
    });

    const getTimeZone = () => ({
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const getLanguageInfo = () => ({
      language: navigator.language,
      languages: navigator.languages,
    });

    const getCookies = () => document.cookie;

    const getLocalStorage = () => ({ ...localStorage });

    const getSessionStorage = () => ({ ...sessionStorage });

    const getNetworkInfo = () => {
      const connection = navigator.connection || {};
      return {
        effectiveType: connection.effectiveType || 'Unknown',
        downlink: connection.downlink || 'Unknown',
        metered: connection.metered || 'Unknown',
      };
    };

    const getBatteryInfo = async () => {
      if (typeof navigator.getBattery !== "undefined") {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          level: battery.level * 100,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
      } else {
        return {
          charging: 'Not supported',
          level: 'Not supported',
          chargingTime: 'Not supported',
          dischargingTime: 'Not supported',
        };
      }
    };

    const getGeolocation = () => {
        return new Promise((resolve) => {
          if ('geolocation' in navigator) {
            const options = {
              enableHighAccuracy: false,
              timeout: 5000, // Set a timeout of 5 seconds
              maximumAge: 0,
            };
      
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: position.coords.altitude || 'Unavailable',
                  speed: position.coords.speed || 'Unavailable',
                });
              },
              (error) => {
                console.error('Geolocation error:', error);
                resolve({
                  latitude: 'Error/Permission Denied',
                  longitude: 'Error/Permission Denied',
                  altitude: 'Error/Permission Denied',
                  speed: 'Error/Permission Denied',
                });
              },
              options
            );
          } else {
            resolve({
              latitude: 'Not supported',
              longitude: 'Not supported',
              altitude: 'Not supported',
              speed: 'Not supported',
            });
          }
        });
      };
      

    const getReferrer = () => document.referrer;

    const getMediaDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map((device) => ({
        kind: device.kind,
        label: device.label,
        deviceId: device.deviceId,
      }));
    };

    const hasTouchScreen = () => navigator.maxTouchPoints > 0;

    const getWebGLInfo = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return 'WebGL not supported';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return { vendor, renderer };
    };

    const getSessionHistory = () => window.history.length;

    const getDoNotTrack = () => navigator.doNotTrack === '1';

    const gatherInfo = async () => {
        
      try {
        // Gather all data asynchronously
        const [
          batteryInfo,
          mediaDevices,
          geolocationInfo,
        ] = await Promise.all([
          getBatteryInfo(),
          getMediaDevices(),
          getGeolocation(),
        ]);
        

        // Now gather all the synchronous data
        const infoObject = {
          browser: getBrowserInfo(),
          os: getOSInfo(),
          screen: getScreenInfo(),
          cpu: getCPUInfo(),
          memory: getMemoryInfo(),
          cpuCores: getCPUCoreInfo(),
          timeZone: getTimeZone(),
          language: getLanguageInfo(),
          cookies: getCookies(),
          localStorage: getLocalStorage(),
          sessionStorage: getSessionStorage(),
          network: getNetworkInfo(),
          battery: batteryInfo,
          geolocation: geolocationInfo,
          referrer: getReferrer(),
          mediaDevices: mediaDevices,
          touchScreen: hasTouchScreen(),
          webGL: getWebGLInfo(),
          sessionHistory: getSessionHistory(),
          doNotTrack: getDoNotTrack(),
        };

        // Update the state with the gathered info
        
        setInfo(infoObject);
      } catch (error) {
        console.error('Error gathering browser info:', error);
      }
    };

    gatherInfo(); // Start gathering info when the component mounts
  }, []);

  return (
    <div className="">
      <h1 className="header-base text-center">[ System Information ]</h1>
      <pre className="pre-base paragraph-txt-size">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
};

export default BrowserInfo;
