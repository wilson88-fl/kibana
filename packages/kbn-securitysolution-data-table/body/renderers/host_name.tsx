/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useContext, useMemo } from 'react';
import type { EuiButtonEmpty, EuiButtonIcon } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { isString } from 'lodash/fp';
import type { ExpandedDetailType } from '../../types';
import { StatefulEventContext } from '../../../../../common/components/events_viewer/stateful_event_context';
import { getScopedActions } from '../../../../../helpers';
import { HostDetailsLink } from '../../../../../common/components/links';
import { TimelineId, TimelineTabs } from '../../types/timeline';
import { DefaultDraggable } from '../../../../../common/components/draggables';
import { getEmptyTagValue } from '../../../../../common/components/empty_value';
import { TruncatableText } from '../../../../../common/components/truncatable_text';
import { activeTimeline } from '../../../../containers/active_timeline_context';

interface Props {
  contextId: string;
  Component?: typeof EuiButtonEmpty | typeof EuiButtonIcon;
  eventId: string;
  fieldName: string;
  fieldType: string;
  isAggregatable: boolean;
  isDraggable: boolean;
  isButton?: boolean;
  onClick?: () => void;
  value: string | number | undefined | null;
  title?: string;
}

const HostNameComponent: React.FC<Props> = ({
  fieldName,
  fieldType,
  isAggregatable,
  Component,
  contextId,
  eventId,
  isDraggable,
  isButton,
  onClick,
  title,
  value,
}) => {
  const dispatch = useDispatch();
  const eventContext = useContext(StatefulEventContext);
  const hostName = `${value}`;
  const isInTimelineContext =
    hostName && eventContext?.enableHostDetailsFlyout && eventContext?.timelineID;
  const openHostDetailsSidePanel = useCallback(
    (e) => {
      e.preventDefault();

      if (onClick) {
        onClick();
      }
      if (eventContext && isInTimelineContext) {
        const { timelineID, tabType } = eventContext;
        const updatedExpandedDetail: ExpandedDetailType = {
          panelView: 'hostDetail',
          params: {
            hostName,
          },
        };
        const scopedActions = getScopedActions(timelineID);
        if (scopedActions) {
          dispatch(
            scopedActions.toggleDetailPanel({
              ...updatedExpandedDetail,
              id: timelineID,
              tabType: tabType as TimelineTabs,
            })
          );
        }

        if (timelineID === TimelineId.active && tabType === TimelineTabs.query) {
          activeTimeline.toggleExpandedDetail({ ...updatedExpandedDetail });
        }
      }
    },
    [onClick, eventContext, isInTimelineContext, hostName, dispatch]
  );

  // The below is explicitly defined this way as the onClick takes precedence when it and the href are both defined
  // When this component is used outside of timeline/alerts table (i.e. in the flyout) we would still like it to link to the Host Details page
  const content = useMemo(
    () => (
      <HostDetailsLink
        Component={Component}
        hostName={hostName}
        isButton={isButton}
        onClick={isInTimelineContext ? openHostDetailsSidePanel : undefined}
        title={title}
      >
        <TruncatableText data-test-subj="draggable-truncatable-content">{hostName}</TruncatableText>
      </HostDetailsLink>
    ),
    [Component, hostName, isButton, isInTimelineContext, openHostDetailsSidePanel, title]
  );

  return isString(value) && hostName.length > 0 ? (
    isDraggable ? (
      <DefaultDraggable
        field={fieldName}
        fieldType={fieldType}
        isAggregatable={isAggregatable}
        id={`event-details-value-default-draggable-${contextId}-${eventId}-${fieldName}-${value}`}
        isDraggable={isDraggable}
        tooltipContent={fieldName}
        value={hostName}
      >
        {content}
      </DefaultDraggable>
    ) : (
      content
    )
  ) : (
    getEmptyTagValue()
  );
};

export const HostName = React.memo(HostNameComponent);
HostName.displayName = 'HostName';
