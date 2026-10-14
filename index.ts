import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent gọi AppRegistry.registerComponent('main', () => App)
// và đảm bảo môi trường đúng cho cả Expo Go lẫn bản build.
registerRootComponent(App);
