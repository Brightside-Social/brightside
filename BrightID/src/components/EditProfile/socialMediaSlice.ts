import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit';

import { original, Draft } from 'immer';

const socialMediaAdapter = createEntityAdapter<SocialMedia>({
  sortComparer: (a, b) => a.order - b.order,
});

const socialMediaSlice = createSlice({
  name: 'socialMedia',
  initialState: socialMediaAdapter.getInitialState(),
  reducers: {
    saveSocialMedia: (
      state: Draft<SocialMediaState>,
      action: PayloadAction<SocialMedia>,
    ) => {
      // incoming payload values
      const {
        id: incomingId,
        order: incomingOrder,
        profile: incomingProfile,
      } = action.payload;

      // access previous values from the reducer
      const { entities, ids } = original(state);

      const prevEntity = entities[incomingId];

      // if social media does not already exist, add it to the list,
      if (!prevEntity) {
        socialMediaAdapter.addOne(state, action);
        // if order already exists in list, then the user wants to replace the social media
        if (incomingOrder < ids.length) {
          const entityToRemove = Object.values(entities).find(
            (entity) => entity.order === incomingOrder,
          );

          socialMediaAdapter.removeOne(state, entityToRemove.id);
        }
      }

      // the user is only updating their social media profile
      if (prevEntity && prevEntity.order === incomingOrder) {
        socialMediaAdapter.updateOne(state, {
          id: incomingId,
          changes: {
            profile: incomingProfile,
          },
        });
      }

      // this indicates the user wants to re-order the list
      if (prevEntity && prevEntity.order !== incomingOrder) {
        // only update the order for
        // 1. incoming id
        // 2. Entities between previous order and incoming order

        const shouldIncrement = prevEntity.order > incomingOrder;
        const shouldDecrement = !shouldIncrement;

        const updateList = Object.values(entities).map((entity) => {
          let { order, profile } = entity;
          if (entity.id === incomingId) {
            order = incomingOrder;
            profile = incomingProfile;
          } else if (
            shouldIncrement &&
            order >= incomingOrder &&
            order <= prevEntity.order
          ) {
            order += 1;
          } else if (
            shouldDecrement &&
            order <= incomingOrder &&
            order >= prevEntity.order
          ) {
            order -= 1;
          }

          return {
            id: entity.id,
            changes: { order, profile },
          };
        });

        socialMediaAdapter.updateMany(state, updateList);
      }
    },
    setProfileDisplayWidth: (
      state: Draft<SocialMediaState>,
      action: PayloadAction<{ id: string; width: number | string }>,
    ) => {
      socialMediaAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          profileDisplayWidth: action.payload.width,
        },
      });
    },
    removeSocialMedia: socialMediaAdapter.removeOne,
  },
});

export const {
  saveSocialMedia,
  removeSocialMedia,
  setProfileDisplayWidth,
} = socialMediaSlice.actions;

export const {
  selectById: selectSocialMediaById,
  selectAll: selectAllSocialMedia,
} = socialMediaAdapter.getSelectors((state: State) => state.socialMedia);

export default socialMediaSlice.reducer;
