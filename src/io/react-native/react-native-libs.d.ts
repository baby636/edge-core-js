// We can't install the React Native type definitions in node_modules,
// since they remove browser types like `window`, which we also need.
//
// Instead, we provide our own local definitions for the few React Native
// things we use.

declare module 'react-native' {
  interface NativeModules {
    RNRandomBytes: {
      randomBytes(
        bytes: number,
        callback: (error: any, base64String: string) => void
      ): void
    }
  }
  const NativeModules: NativeModules

  interface Platform {
    OS: 'android' | 'ios'
  }
  const Platform: any

  interface StyleSheet {
    create<T>(template: T): T
  }
  const StyleSheet: any

  export class View extends React.Component<{
    style: any
  }> {
    // Empty
  }
}

declare module 'react-native-fast-crypto' {
  function scrypt(
    data: Uint8Array,
    salt: Uint8Array,
    n: number,
    r: number,
    p: number,
    dklen: number
  ): Promise<Uint8Array>
}

declare module 'react-native-fs' {
  interface RNFS {
    MainBundlePath: string
  }

  const RNFS: RNFS
  export default RNFS
}

declare module 'react-native-webview' {
  interface WebViewMessageEvent {
    nativeEvent: {
      data: any
    }
  }

  export class WebView extends React.Component<{
    allowFileAccess: boolean
    onMessage: (message: WebViewMessageEvent) => void
    originWhitelist: string[]
    source: { uri: string }
  }> {
    injectJavaScript(js: string): unknown
  }
}
