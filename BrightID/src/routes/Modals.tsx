import React from 'react';
import {
  createStackNavigator,
} from '@react-navigation/stack';
import FullScreenPhoto from '@/components/Helpers/FullScreenPhoto';
import ChangePasswordModal from '@/components/EditProfile/ChangePasswordModal';
import TrustlevelModal from '@/components/Connections/TrustlevelModal';
import SelectSocialMediaModal from '@/components/EditProfile/SelectSocialMediaModal';
import ReportReasonModal from '@/components/Connections/ReportReasonModal';
import SortConnectionsModal from '@/components/Helpers/SortConnectionsModal';
import ViewPassword from '@/components/Onboarding/Walkthroughs/ViewPassword';
import RecoveryCooldownInfoModal from '@/components/Recovery/RecoveryCooldownInfoModal';
import { modalOptions } from './helpers'

const Stack = createStackNavigator<ModalStackParamList>();

const Modals = () => {
  return (
    <>
      <Stack.Screen
        name="FullScreenPhoto"
        component={FullScreenPhoto}
        options={modalOptions}
      />
      <Stack.Screen
        name="ChangePassword"
        options={modalOptions}
        component={ChangePasswordModal}
      />
      <Stack.Screen
        name="SelectSocialMedia"
        options={modalOptions}
        component={SelectSocialMediaModal}
      />
      <Stack.Screen
        name="SetTrustlevel"
        options={modalOptions}
        component={TrustlevelModal}
      />
      <Stack.Screen
        name="ReportReason"
        options={modalOptions}
        component={ReportReasonModal}
      />
      <Stack.Screen
        name="SortConnections"
        options={modalOptions}
        component={SortConnectionsModal}
      />
      <Stack.Screen
        name="ViewPasswordWalkthrough"
        options={modalOptions}
        component={ViewPassword}
      />
      <Stack.Screen
        name="RecoveryCooldownInfo"
        options={modalOptions}
        component={RecoveryCooldownInfoModal}
      />
    </>
  );
};



export default Modals;
