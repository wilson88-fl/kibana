/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  alertComment,
  basicCase,
  connectorsMock,
  getCaseUsersMockResponse,
  getUserAction,
} from '../../../containers/mock';
import React from 'react';
import type { AppMockRenderer } from '../../../common/mock';
import { createAppMockRenderer, noUpdateCasesPermissions } from '../../../common/mock';
import { CaseViewActivity } from './case_view_activity';
import { ConnectorTypes } from '../../../../common/api/connectors';
import type { Case } from '../../../../common';
import type { CaseViewProps } from '../types';
import { useFindCaseUserActions } from '../../../containers/use_find_case_user_actions';
import { usePostPushToService } from '../../../containers/use_post_push_to_service';
import { useGetSupportedActionConnectors } from '../../../containers/configure/use_get_supported_action_connectors';
import { useGetTags } from '../../../containers/use_get_tags';
import { useGetCaseConnectors } from '../../../containers/use_get_case_connectors';
import { useGetCaseUsers } from '../../../containers/use_get_case_users';
import { licensingMock } from '@kbn/licensing-plugin/public/mocks';
import { waitForComponentToUpdate } from '../../../common/test_utils';
import { waitFor, within } from '@testing-library/dom';
import { getCaseConnectorsMockResponse } from '../../../common/mock/connectors';
import { defaultUseFindCaseUserActions } from '../mocks';
import { ActionTypes } from '../../../../common/api';

jest.mock('../../../containers/use_find_case_user_actions');
jest.mock('../../../containers/configure/use_get_supported_action_connectors');
jest.mock('../../../containers/use_post_push_to_service');
jest.mock('../../user_actions/timestamp', () => ({
  UserActionTimestamp: () => <></>,
}));
jest.mock('../../../common/navigation/hooks');
jest.mock('../../../containers/use_get_action_license');
jest.mock('../../../containers/use_get_tags');
jest.mock('../../../containers/user_profiles/use_bulk_get_user_profiles');
jest.mock('../../../containers/use_get_case_connectors');
jest.mock('../../../containers/use_get_case_users');

(useGetTags as jest.Mock).mockReturnValue({ data: ['coke', 'pepsi'], refetch: jest.fn() });

const caseData: Case = {
  ...basicCase,
  comments: [...basicCase.comments, alertComment],
  connector: {
    id: 'resilient-2',
    name: 'Resilient',
    type: ConnectorTypes.resilient,
    fields: null,
  },
};

const caseViewProps: CaseViewProps = {
  onComponentInitialized: jest.fn(),
  actionsNavigation: {
    href: jest.fn(),
    onClick: jest.fn(),
  },
  ruleDetailsNavigation: {
    href: jest.fn(),
    onClick: jest.fn(),
  },
  showAlertDetails: jest.fn(),
  useFetchAlertData: () => [
    false,
    {
      'alert-id-1': '1234',
      'alert-id-2': '1234',
    },
  ],
};
const pushCaseToExternalService = jest.fn();

export const caseProps = {
  ...caseViewProps,
  caseData,
  fetchCaseMetrics: jest.fn(),
};

const caseUsers = getCaseUsersMockResponse();

const useFindCaseUserActionsMock = useFindCaseUserActions as jest.Mock;
const useGetConnectorsMock = useGetSupportedActionConnectors as jest.Mock;
const usePostPushToServiceMock = usePostPushToService as jest.Mock;
const useGetCaseConnectorsMock = useGetCaseConnectors as jest.Mock;
const useGetCaseUsersMock = useGetCaseUsers as jest.Mock;

describe('Case View Page activity tab', () => {
  const caseConnectors = getCaseConnectorsMockResponse();

  beforeAll(() => {
    useGetConnectorsMock.mockReturnValue({ data: connectorsMock, isLoading: false });
    usePostPushToServiceMock.mockReturnValue({ isLoading: false, pushCaseToExternalService });
    useGetCaseConnectorsMock.mockReturnValue({
      isLoading: false,
      data: caseConnectors,
    });
  });
  let appMockRender: AppMockRenderer;

  const platinumLicense = licensingMock.createLicense({
    license: { type: 'platinum' },
  });

  const basicLicense = licensingMock.createLicense({
    license: { type: 'basic' },
  });

  beforeEach(() => {
    appMockRender = createAppMockRenderer();
    useFindCaseUserActionsMock.mockReturnValue(defaultUseFindCaseUserActions);
    useGetCaseUsersMock.mockReturnValue({ isLoading: false, data: caseUsers });
  });

  it('should render the activity content and main components', async () => {
    appMockRender = createAppMockRenderer({ license: platinumLicense });
    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

    expect(result.getByTestId('case-view-activity')).toBeTruthy();
    expect(result.getByTestId('user-actions')).toBeTruthy();
    expect(result.getByTestId('case-tags')).toBeTruthy();
    expect(result.getByTestId('connector-edit-header')).toBeTruthy();
    expect(result.getByTestId('case-view-status-action-button')).toBeTruthy();
    expect(useFindCaseUserActionsMock).toHaveBeenCalledWith(caseData.id);

    await waitForComponentToUpdate();
  });

  it('should not render the case view status button when the user does not have update permissions', async () => {
    appMockRender = createAppMockRenderer({
      permissions: noUpdateCasesPermissions(),
      license: platinumLicense,
    });

    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
    expect(result.getByTestId('case-view-activity')).toBeTruthy();
    expect(result.getByTestId('user-actions')).toBeTruthy();
    expect(result.getByTestId('case-tags')).toBeTruthy();
    expect(result.getByTestId('connector-edit-header')).toBeTruthy();
    expect(result.queryByTestId('case-view-status-action-button')).not.toBeInTheDocument();
    expect(useFindCaseUserActionsMock).toHaveBeenCalledWith(caseData.id);

    await waitForComponentToUpdate();
  });

  it('should disable the severity selector when the user does not have update permissions', async () => {
    appMockRender = createAppMockRenderer({
      permissions: noUpdateCasesPermissions(),
      license: platinumLicense,
    });

    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
    expect(result.getByTestId('case-view-activity')).toBeTruthy();
    expect(result.getByTestId('user-actions')).toBeTruthy();
    expect(result.getByTestId('case-tags')).toBeTruthy();
    expect(result.getByTestId('connector-edit-header')).toBeTruthy();
    expect(result.getByTestId('case-severity-selection')).toBeDisabled();
    expect(useFindCaseUserActionsMock).toHaveBeenCalledWith(caseData.id);

    await waitForComponentToUpdate();
  });

  it('should show a loading when is fetching data is true and hide the user actions activity', () => {
    useFindCaseUserActionsMock.mockReturnValue({
      ...defaultUseFindCaseUserActions,
      isFetching: true,
      isLoading: true,
    });
    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
    expect(result.getByTestId('case-view-loading-content')).toBeTruthy();
    expect(result.queryByTestId('case-view-activity')).toBeFalsy();
    expect(useFindCaseUserActionsMock).toHaveBeenCalledWith(caseData.id);
  });

  it('should not render the assignees on basic license', () => {
    appMockRender = createAppMockRenderer({ license: basicLicense });

    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
    expect(result.queryByTestId('case-view-assignees')).toBeNull();
  });

  it('should render the assignees on platinum license', async () => {
    appMockRender = createAppMockRenderer({ license: platinumLicense });

    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
    expect(result.getByTestId('case-view-assignees')).toBeInTheDocument();

    await waitForComponentToUpdate();
  });

  it('should not render the connector on basic license', () => {
    appMockRender = createAppMockRenderer({ license: basicLicense });

    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
    expect(result.queryByTestId('case-view-edit-connector')).toBeNull();
  });

  it('should render the connector on platinum license', async () => {
    appMockRender = createAppMockRenderer({ license: platinumLicense });

    const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

    await waitFor(() => {
      expect(result.getByTestId('case-view-edit-connector')).toBeInTheDocument();
    });
  });

  describe('Case users', () => {
    describe('Participants', () => {
      it('should render the participants correctly', async () => {
        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
        const participantsSection = within(result.getByTestId('case-view-user-list-participants'));

        await waitFor(() => {
          expect(participantsSection.getByText('Participant 1')).toBeInTheDocument();
          expect(participantsSection.getByText('participant_2@elastic.co')).toBeInTheDocument();
          expect(participantsSection.getByText('participant_3')).toBeInTheDocument();
          expect(participantsSection.getByText('P4')).toBeInTheDocument();
          expect(participantsSection.getByText('Participant 5')).toBeInTheDocument();
        });
      });

      it('should render Unknown users correctly', async () => {
        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

        const participantsSection = within(result.getByTestId('case-view-user-list-participants'));

        await waitFor(() => {
          expect(participantsSection.getByText('Unknown')).toBeInTheDocument();
        });
      });

      it('should render assignees in the participants section', async () => {
        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

        const participantsSection = within(result.getByTestId('case-view-user-list-participants'));

        await waitFor(() => {
          expect(participantsSection.getByText('Unknown')).toBeInTheDocument();
          expect(participantsSection.getByText('Fuzzy Marten')).toBeInTheDocument();
          expect(participantsSection.getByText('elastic')).toBeInTheDocument();
          expect(participantsSection.getByText('Misty Mackerel')).toBeInTheDocument();
        });
      });
    });

    describe('Reporter', () => {
      it('should render the reporter correctly', async () => {
        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
        const reporterSection = within(result.getByTestId('case-view-user-list-reporter'));

        await waitFor(() => {
          expect(reporterSection.getByText('Reporter 1')).toBeInTheDocument();
          expect(reporterSection.getByText('R1')).toBeInTheDocument();
        });
      });

      it('should render a reporter without uid correctly', async () => {
        useGetCaseUsersMock.mockReturnValue({
          isLoading: false,
          data: {
            ...caseUsers,
            reporter: {
              user: {
                email: 'reporter_no_uid@elastic.co',
                full_name: 'Reporter No UID',
                username: 'reporter_no_uid',
              },
            },
          },
        });

        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
        const reporterSection = within(result.getByTestId('case-view-user-list-reporter'));

        await waitFor(() => {
          expect(reporterSection.getByText('Reporter No UID')).toBeInTheDocument();
        });
      });

      it('fallbacks to the caseData reporter correctly', async () => {
        useGetCaseUsersMock.mockReturnValue({
          isLoading: false,
          data: null,
        });

        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);
        const reporterSection = within(result.getByTestId('case-view-user-list-reporter'));

        await waitFor(() => {
          expect(reporterSection.getByText('Leslie Knope')).toBeInTheDocument();
        });
      });
    });

    describe('Assignees', () => {
      it('should render assignees in the participants section', async () => {
        appMockRender = createAppMockRenderer({ license: platinumLicense });
        const result = appMockRender.render(
          <CaseViewActivity
            {...caseProps}
            caseData={{
              ...caseProps.caseData,
              assignees: caseUsers.assignees.map((assignee) => ({
                uid: assignee.uid ?? 'not-valid',
              })),
            }}
          />
        );

        const assigneesSection = within(await result.findByTestId('case-view-assignees'));

        await waitFor(() => {
          expect(assigneesSection.getByText('Unknown')).toBeInTheDocument();
          expect(assigneesSection.getByText('Fuzzy Marten')).toBeInTheDocument();
          expect(assigneesSection.getByText('elastic')).toBeInTheDocument();
          expect(assigneesSection.getByText('Misty Mackerel')).toBeInTheDocument();
        });
      });
    });

    describe('User actions', () => {
      it('renders the descriptions user correctly', async () => {
        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

        const description = within(result.getByTestId('description-action'));

        await waitFor(() => {
          expect(description.getByText('Leslie Knope')).toBeInTheDocument();
        });
      });

      it('renders the unassigned users correctly', async () => {
        useFindCaseUserActionsMock.mockReturnValue({
          ...defaultUseFindCaseUserActions,
          data: {
            userActions: [getUserAction(ActionTypes.assignees, 'delete')],
          },
        });

        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

        const userActions = within(result.getByTestId('user-actions'));

        await waitFor(() => {
          expect(userActions.getByText('cases_no_connectors')).toBeInTheDocument();
          expect(userActions.getByText('Valid Chimpanzee')).toBeInTheDocument();
        });
      });

      it('renders the assigned users correctly', async () => {
        useFindCaseUserActionsMock.mockReturnValue({
          ...defaultUseFindCaseUserActions,
          data: {
            userActions: [
              getUserAction(ActionTypes.assignees, 'add', {
                payload: {
                  assignees: [
                    { uid: 'not-valid' },
                    { uid: 'u_3OgKOf-ogtr8kJ5B0fnRcqzXs2aQQkZLtzKEEFnKaYg_0' },
                  ],
                },
              }),
            ],
          },
        });

        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

        const userActions = within(result.getByTestId('user-actions'));

        await waitFor(() => {
          expect(userActions.getByText('Fuzzy Marten')).toBeInTheDocument();
          expect(userActions.getByText('Unknown')).toBeInTheDocument();
        });
      });

      it('renders the user action users correctly', async () => {
        useFindCaseUserActionsMock.mockReturnValue({
          ...defaultUseFindCaseUserActions,
          data: {
            userActions: [
              getUserAction('description', 'create'),
              getUserAction('description', 'update', {
                createdBy: {
                  ...caseUsers.participants[0].user,
                  fullName: caseUsers.participants[0].user.full_name,
                  profileUid: caseUsers.participants[0].uid,
                },
              }),
              getUserAction('comment', 'update', {
                createdBy: {
                  ...caseUsers.participants[1].user,
                  fullName: caseUsers.participants[1].user.full_name,
                  profileUid: caseUsers.participants[1].uid,
                },
              }),
              getUserAction('description', 'update', {
                createdBy: {
                  ...caseUsers.participants[2].user,
                  fullName: caseUsers.participants[2].user.full_name,
                  profileUid: caseUsers.participants[2].uid,
                },
              }),
              getUserAction('title', 'update', {
                createdBy: {
                  ...caseUsers.participants[3].user,
                  fullName: caseUsers.participants[3].user.full_name,
                  profileUid: caseUsers.participants[3].uid,
                },
              }),
              getUserAction('tags', 'add', {
                createdBy: {
                  ...caseUsers.participants[4].user,
                  fullName: caseUsers.participants[4].user.full_name,
                  profileUid: caseUsers.participants[4].uid,
                },
              }),
            ],
          },
        });

        appMockRender = createAppMockRenderer();
        const result = appMockRender.render(<CaseViewActivity {...caseProps} />);

        const userActions = within(result.getByTestId('user-actions'));

        await waitFor(() => {
          expect(userActions.getByText('Participant 1')).toBeInTheDocument();
          expect(userActions.getByText('participant_2@elastic.co')).toBeInTheDocument();
          expect(userActions.getByText('participant_3')).toBeInTheDocument();
          expect(userActions.getByText('P4')).toBeInTheDocument();
          expect(userActions.getByText('Participant 5')).toBeInTheDocument();
        });
      });
    });
  });
});
