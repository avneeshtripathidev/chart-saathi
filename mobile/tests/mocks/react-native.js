module.exports = {
  Platform: {
    OS: 'ios',
    select: (objs) => objs.ios ?? objs.default,
  },
  StyleSheet: {
    create: (styles) => styles,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  RefreshControl: 'RefreshControl',
  Alert: {
    alert: () => {},
  },
  Linking: {
    openURL: () => Promise.resolve(),
  },
  Switch: 'Switch',
};
