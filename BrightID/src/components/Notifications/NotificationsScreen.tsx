import React, { useCallback, useContext, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  FlatList,
  Text,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from '@/store';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { TabBar, TabView, SceneMap } from 'react-native-tab-view';
import {
  INVITE_ACTIVE,
  CONNECTIONS_TYPE,
  GROUPS_TYPE,
  MISC_TYPE,
} from '@/utils/constants';
import { ORANGE, WHITE, GREY, BLACK } from '@/theme/colors';
import { fontSize } from '@/theme/fonts';
import { DEVICE_LARGE } from '@/utils/deviceConstants';
import { createSelector } from '@reduxjs/toolkit';
import { selectAllUnconfirmedConnections } from '@/components/PendingConnections/pendingConnectionSlice';
import fetchUserInfo from '@/actions/fetchUserInfo';
import EmptyList from '@/components/Helpers/EmptyList';
import { photoDirectory } from '@/utils/filesystem';
import { NodeApiContext } from '@/components/NodeApiGate';
import NotificationCard from './NotificationCard';
import InviteCard from './InviteCard';
import PendingConnectionCard from './PendingConnectionCard';

let thecount = 0;

/** SELECTORS */

const inviteSelector = createSelector(
  (state: State) => state.groups.invites,
  (invites) => invites.filter(({ state }) => state === INVITE_ACTIVE),
);

/** HOOKS */

const useRefresh: () => [boolean, () => void] = () => {
  const dispatch = useDispatch();
  const api = useContext(NodeApiContext);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchUserInfo(api))
      .then(() => {
        setRefreshing(true);
      })
      .catch((err) => {
        console.log(err.message);
        setRefreshing(false);
      });
    setRefreshing(false);
  };
  return [refreshing, onRefresh];
};

/** TYPES */

type Route = {
  badge: boolean;
  backupPending?: boolean;
  recoveryConnectionsPending?: boolean;
  title?: string;
};
/** COMPONENTS  */

const ConnectionsList = () => {
  const [refreshing, onRefresh] = useRefresh();
  const pendingConnections = useSelector((state) =>
    selectAllUnconfirmedConnections(state),
  );
  const { t } = useTranslation();
  // only display one notification for all pending connections
  const data = pendingConnections.length > 0 ? [{ id: 'pendingList' }] : [];

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
      data={data}
      keyExtractor={({ id }, index) => id + index}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <EmptyList
          title={t('notifications.text.noPendingConnections')}
          iconType="account-off-outline"
        />
      }
      renderItem={() => (
        <PendingConnectionCard pendingConnections={pendingConnections} />
      )}
    />
  );
};

const InviteList = () => {
  const { t } = useTranslation();
  const [refreshing, onRefresh] = useRefresh();
  const invites = useSelector((state) => inviteSelector(state));
  thecount++;
  console.log('Rendering Invite List', thecount);

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
      data={invites}
      keyExtractor={({ inviteId }, index) => inviteId + index}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <EmptyList
          title={t('notifications.text.noGroupInvites')}
          iconType="account-group-outline"
        />
      }
      renderItem={({ item }) => <InviteCard invite={item} />}
    />
  );
};

const MiscList = ({ route }: { route: Route }) => {
  const { t } = useTranslation();
  const photoFilename = useSelector((state) => state.user.photo.filename);
  const [refreshing, onRefresh] = useRefresh();
  const data = [];

  if (route.recoveryConnectionsPending) {
    // TODO: Set better image
    const imageSource = photoFilename
      ? { uri: `file://${photoDirectory()}/${photoFilename}` }
      : require('@/static/default_profile.jpg');
    data.push({
      title: t('notifications.item.title.socialRecovery'),
      msg: t('notifications.item.msg.socialRecovery'),
      imageSource,
      navigationTarget: 'TrustedConnections',
      testID: 'SocialRecoveryNotifcation',
    });
  }

  if (route.backupPending) {
    // TODO: Set appropriate image
    const imageSource = photoFilename
      ? { uri: `file://${photoDirectory()}/${photoFilename}` }
      : require('@/static/default_profile.jpg');
    data.push({
      title: t('notifications.item.title.backupBrightId'),
      msg: t('notifications.item.msg.backupBrightId'),
      imageSource,
      navigationTarget: 'Edit Profile',
      testID: 'BackupNotification',
    });
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
      data={data}
      keyExtractor={({ msg }, index) => msg + index}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <EmptyList
          title={t('notifications.text.noMiscellaneous')}
          iconType="bell-off-outline"
        />
      }
      renderItem={({ item }) => (
        <NotificationCard
          title={item.title}
          msg={item.msg}
          imageSource={item.imageSource}
          navigationTarget={item.navigationTarget}
          testID={item.testID}
        />
      )}
    />
  );
};

const initialLayout = { width: Dimensions.get('window').width };

const renderTabBar = (props) => (
  <TabBar
    {...props}
    indicatorStyle={{ backgroundColor: ORANGE }}
    style={styles.tabBar}
    // tabStyle={{ width: 'auto', flex: 1 }}
    renderLabel={({ route, color }: { route: Route; color: string }) => (
      <View style={styles.tabContainer}>
        {route.badge && <View style={styles.badge} />}
        <Text
          style={[styles.tabText, { color }]}
          adjustsFontSizeToFit={true}
          numberOfLines={1}
        >
          {route.title}
        </Text>
      </View>
    )}
    inactiveColor={GREY}
    activeColor={BLACK}
  // bounces={true}
  />
);

// type NotificationsRoute = RouteProp<
//   {
//     Notifications: {
//       type?: typeof CONNECTIONS_TYPE | typeof GROUPS_TYPE | typeof MISC_TYPE;
//     };
//   },
//   'Notifications'
// >;

export const NotificationsScreen = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const api = useContext(NodeApiContext);

  const pendingConnections = useSelector(
    (state) => selectAllUnconfirmedConnections(state)?.length,
  );

  const invites = useSelector((state) => inviteSelector(state)?.length);

  const backupPending = useSelector(
    (state) => state.notifications.backupPending,
  );

  const recoveryConnectionsPending = useSelector(
    (state) => state.notifications.recoveryConnectionsPending,
  );

  const routes = [
    {
      key: CONNECTIONS_TYPE,
      title: t('notifications.tab.connections'),
      badge: !!pendingConnections,
    },
    {
      key: GROUPS_TYPE,
      title: t('notifications.tab.groups'),
      badge: !!invites,
    },
    {
      key: MISC_TYPE,
      title: t('notifications.tab.miscellaneous'),
      badge: backupPending || recoveryConnectionsPending,
      backupPending,
      recoveryConnectionsPending,
    },
  ];

  // if we navigate here normally, go to the first route with content, if any
  const displayRoute = routes.findIndex(({ badge }) => badge)

  const [index, setIndex] = useState(displayRoute > 0 ? displayRoute : 0);

  const renderScene = SceneMap({
    [CONNECTIONS_TYPE]: ConnectionsList,
    [GROUPS_TYPE]: InviteList,
    [MISC_TYPE]: MiscList,
  });

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUserInfo(api));
    }, [api, dispatch]),
  );

  console.log('renderingNotificationScreen');

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ORANGE}
        animated={true}
      />
      <View style={styles.orangeTop} />
      <View style={styles.container} testID="NotificationsScreen">
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  orangeTop: {
    backgroundColor: ORANGE,
    height: DEVICE_LARGE ? 70 : 62,
    width: '100%',
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: 58,
    marginTop: -58,
    zIndex: 10,
    overflow: 'hidden',
  },
  badge: {
    backgroundColor: ORANGE,
    width: DEVICE_LARGE ? 8 : 6,
    height: DEVICE_LARGE ? 8 : 6,
    borderRadius: 4,
    marginRight: DEVICE_LARGE ? 8 : 6,
  },
  tabBar: { backgroundColor: WHITE, paddingLeft: DEVICE_LARGE ? 20 : 18 },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Poppins-Medium',
    fontSize: fontSize[12],
  },
});

export default NotificationsScreen;
