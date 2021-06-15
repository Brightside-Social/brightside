import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';
import Spinner from 'react-native-spinkit';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from '@/store';
import { selectAllUnconfirmedConnections } from '@/components/PendingConnections/pendingConnectionSlice';
import { DEVICE_LARGE, DEVICE_ANDROID } from '@/utils/deviceConstants';
import { WHITE, GREY, DARK_GREY, BLACK, ORANGE } from '@/theme/colors';
import { fontSize } from '@/theme/fonts';
import { setActiveNotification } from '@/actions';
import { PreviewConnectionController } from './PreviewConnectionController';
import BackArrow from '../Icons/BackArrow';

/**
 * Confirm / Preview Connection  Screen of BrightID
 *
==================================================================
 *
 */
const REFRESH_PAGERVIEW_TIMEOUT = 1000;

export const PendingConnectionsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const pagerViewRef = useRef<PagerView>(null);

  const pendingConnections = useSelector((state: State) => {
    return selectAllUnconfirmedConnections(state);
  });
  // pending connections to display
  const [pendingConnectionsToDisplay, setPendingConnectionsDisplay] = useState(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [onLastIndex, setOnLastIndex] = useState(false);
  const [total, setTotal] = useState(pendingConnections.length);
  const [confirmed, setConfirmed] = useState(0);

  const refreshDisplayConnections = useCallback(() => {
    /**
     * this will cause the PagerView to re render
     * for performance on android, we will limit the list to ~ 15 connections
     * */

    let connectionsToDisplay = pendingConnections;

    if (DEVICE_ANDROID && pendingConnections.length > 17) {
      connectionsToDisplay = pendingConnections.slice(0, 15);
    }
    // test peformance, alternative would be to map ids
    if (!isEqual(pendingConnectionsToDisplay, connectionsToDisplay)) {
      setPendingConnectionsDisplay(connectionsToDisplay);
    }
  }, [pendingConnections, pendingConnectionsToDisplay]);

  useFocusEffect(
    useCallback(() => {
      refreshDisplayConnections();
      dispatch(setActiveNotification(null));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    // update total
    if (pendingConnections.length > total) {
      setTotal(pendingConnections.length);
    } else if (confirmed > total) {
      setTotal(confirmed);
    }
  }, [pendingConnections, total, confirmed]);

  // NAVIGATION

  useEffect(() => {
    /**
     * we will always refresh the display list
     * when navigating away from the last page
     * */
    if (activeIndex === pendingConnectionsToDisplay.length - 1) {
      setOnLastIndex(true);
    } else if (onLastIndex) {
      refreshDisplayConnections();
      setOnLastIndex(false);
    }
  }, [
    refreshDisplayConnections,
    pendingConnectionsToDisplay.length,
    activeIndex,
    onLastIndex,
  ]);

  // back handling for android
  useEffect(() => {
    const goBack = () => {
      if (activeIndex > 0) {
        pagerViewRef.current?.setPage(activeIndex - 1);
        return true;
      }
    };
    BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => BackHandler.removeEventListener('hardwareBackPress', goBack);
  }, [pagerViewRef, activeIndex]);

  // leave page if zero pending connections
  useEffect(() => {
    let timeout;
    if (pendingConnections.length === 0) {
      setLoading(true);
      timeout = setTimeout(() => {
        navigation.navigate('Connections');
      }, REFRESH_PAGERVIEW_TIMEOUT);
    } else {
      setLoading(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [pendingConnections.length, navigation]);

  /**
    the list should only re render sparingly for performance and continuity
  */
  const PendingConnectionList = useMemo(() => {
    const renderView = (item, index) => {
      const last = index === pendingConnectionsToDisplay.length - 1;
      const moveToNext = () => {
        /**
        setting pagerview active index zero will trigger the list to re - render
        */
        last
          ? pagerViewRef.current?.setPage(0)
          : pagerViewRef.current?.setPage(index + 1);
        setConfirmed((c) => c + 1);
      };

      return (
        <View
          style={{ flex: 1, width: '100%' }}
          collapsable={false}
          key={index}
        >
          <PreviewConnectionController
            pendingConnectionId={item.id}
            moveToNext={moveToNext}
          />
        </View>
      );
    };
    console.log('RE-RENDERING PagerView');

    const Views = pendingConnectionsToDisplay.map(renderView);

    return (
      <PagerView
        ref={pagerViewRef}
        style={{ flex: 1, width: '100%' }}
        initialPage={0}
        onPageSelected={(e) => {
          setActiveIndex(e.nativeEvent.position);
        }}
        orientation="horizontal"
        transitionStyle="scroll"
        showPageIndicator={false}
      >
        {Views}
      </PagerView>
    );
  }, [pendingConnectionsToDisplay]);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={WHITE}
        animated={true}
      />
      <SafeAreaView style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Spinner
              isVisible={true}
              size={DEVICE_LARGE ? 44 : 40}
              type="FadingCircleAlt"
              color={GREY}
            />
          </View>
        ) : (
          <>
            <View style={styles.titleContainer}>
              <TouchableOpacity
                testID="pendingConnectionsGoBack"
                style={styles.cancelButton}
                onPress={() => {
                  if (total > 1) {
                    // group connections navigate to MyCodeScreen or GroupConnectionScreen
                    navigation.goBack();
                  } else {
                    // single connections navigate home to avoid loop
                    navigation.navigate('Home');
                  }
                }}
              >
                <BackArrow height={DEVICE_LARGE ? 22 : 20} color={DARK_GREY} />
              </TouchableOpacity>
              <Text style={styles.titleText}>
                {t('pendingConnections.title.confirmationTotal', {
                  confirmed,
                  total,
                })}
              </Text>
            </View>
            {PendingConnectionList}
          </>
        )}
      </SafeAreaView>
      <View style={styles.orangeBottom} />
    </>
  );
};

const styles = StyleSheet.create({
  orangeBottom: {
    backgroundColor: ORANGE,
    height: 90,
    width: '100%',
    zIndex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: WHITE,
    borderBottomLeftRadius: 58,
    borderBottomRightRadius: 58,
    marginBottom: -80,
    zIndex: 10,
    overflow: 'hidden',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: DEVICE_LARGE ? 18 : 12,
  },
  loadingContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: 'Poppins-Bold',
    fontSize: fontSize[20],
    textAlign: 'center',
    color: BLACK,
  },
  cancelButton: {
    position: 'absolute',
    left: 0,
    width: DEVICE_LARGE ? 60 : 50,
    alignItems: 'center',
  },
});

export default PendingConnectionsScreen;
