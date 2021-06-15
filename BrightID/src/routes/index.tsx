import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from '@/store';
import NodeApiGate from '@/components/NodeApiGate';
// import { PersistGate } from 'redux-persist/es/integration/react';
import Apps from './Apps';
import Backup from './Backup';
import Connections from './Connections';
import Eula from './Eula';
import Groups from './Groups';
import Home from './Home';
import Modals from './Modals';
import PendingConnections from './PendingConnections';
import Notifications from './Notifications';
import Onboarding from './Onboarding';
// import { modalOptions } from './helpers'

const TopStack = createStackNavigator();
const Stack = createStackNavigator();

const MainTabs = () => {
  return (
    <Stack.Navigator headerMode="screen" detachInactiveScreens={false}>
      {Home()}
      {PendingConnections()}
      {Connections()}
      {Groups()}
      {Notifications()}
      {Apps()}
      {Modals()}
      {/* <Stack.Screen
        name="Modal"
        component={Modals}
        options={modalOptions}
      /> */}
      {Backup()}
    </Stack.Navigator>
  );
};

const MainApp = () => {
  const id = useSelector((state: State) => state.user.id);
  const eula = useSelector((state: State) => state.user.eula);
  return (
    <NodeApiGate>
      <TopStack.Navigator>
        {!eula ? (
          <TopStack.Screen
            name="Eula"
            component={Eula}
            options={{ headerShown: false }}
          />
        ) : !id ? (
          <TopStack.Screen
            name="Onboarding"
            component={Onboarding}
            options={{ headerShown: false }}
          />
        ) : (
          <TopStack.Screen
            name="App"
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
      </TopStack.Navigator>
    </NodeApiGate>
  );
};

export default MainApp;
