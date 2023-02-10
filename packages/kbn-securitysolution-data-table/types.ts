/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import * as runtimeTypes from 'io-ts';

export enum Direction {
  asc = 'asc',
  desc = 'desc',
}

export type SortDirectionTable = 'none' | 'asc' | 'desc' | Direction;
export interface SortColumnTable {
  columnId: string;
  columnType: string;
  esTypes?: string[];
  sortDirection: SortDirectionTable;
}

export enum TableId {
  usersPageEvents = 'users-page-events',
  hostsPageEvents = 'hosts-page-events',
  networkPageEvents = 'network-page-events',
  hostsPageSessions = 'hosts-page-sessions-v2', // the v2 is to cache bust localstorage settings as default columns were reworked.
  alertsOnRuleDetailsPage = 'alerts-rules-details-page',
  alertsOnAlertsPage = 'alerts-page',
  test = 'table-test', // Reserved for testing purposes
  alternateTest = 'alternateTest',
  rulePreview = 'rule-preview',
  kubernetesPageSessions = 'kubernetes-page-sessions',
}

const TableIdLiteralRt = runtimeTypes.union([
  runtimeTypes.literal(TableId.usersPageEvents),
  runtimeTypes.literal(TableId.hostsPageEvents),
  runtimeTypes.literal(TableId.networkPageEvents),
  runtimeTypes.literal(TableId.hostsPageSessions),
  runtimeTypes.literal(TableId.alertsOnRuleDetailsPage),
  runtimeTypes.literal(TableId.alertsOnAlertsPage),
  runtimeTypes.literal(TableId.test),
  runtimeTypes.literal(TableId.rulePreview),
  runtimeTypes.literal(TableId.kubernetesPageSessions),
]);
export type TableIdLiteral = runtimeTypes.TypeOf<typeof TableIdLiteralRt>;

import {
  EuiDataGridCellValueElementProps,
  EuiDataGridColumn,
  EuiDataGridColumnCellActionProps,
} from '@elastic/eui';
import { Filter, IFieldSubType } from '@kbn/es-query';
import { BrowserFields } from '@kbn/rule-registry-plugin/common';
// eslint-disable-next-line @kbn/imports/no_boundary_crossing
import { TimelineNonEcsData } from '@kbn/triggers-actions-ui-plugin/public/application/sections/alerts_table/bulk_actions/components/toolbar';
import { ReactNode } from 'react';

export type ColumnHeaderType = 'not-filtered' | 'text-filter';

import type { EcsSecurityExtension as Ecs } from '@kbn/securitysolution-ecs';
import { RowRenderer, TimelineItem } from '@kbn/timelines-plugin/common';

/** Uniquely identifies a column */
export type ColumnId = string;

export type DataTableCellAction = ({
  browserFields,
  data,
  ecsData,
  header,
  pageSize,
  scopeId,
  closeCellPopover,
}: {
  browserFields: BrowserFields;
  /** each row of data is represented as one TimelineNonEcsData[] */
  data: TimelineNonEcsData[][];
  ecsData: Ecs[];
  header?: ColumnHeaderOptions;
  pageSize: number;
  scopeId: string;
  closeCellPopover?: () => void;
}) => (props: EuiDataGridColumnCellActionProps) => ReactNode;

export type KueryFilterQueryKind = 'kuery' | 'lucene' | 'eql';

export interface KueryFilterQuery {
  kind: KueryFilterQueryKind;
  expression: string;
}

export interface SerializedFilterQuery {
  kuery: KueryFilterQuery | null;
  serializedQuery: string;
}

/** Invoked when a column is sorted */
export type OnColumnSorted = (sorted: { columnId: ColumnId; sortDirection: SortDirection }) => void;

export type OnColumnsSorted = (
  sorted: Array<{ columnId: ColumnId; sortDirection: SortDirection }>
) => void;

export type OnColumnRemoved = (columnId: ColumnId) => void;

export type OnColumnResized = ({ columnId, delta }: { columnId: ColumnId; delta: number }) => void;

/** Invoked when a user clicks to load more item */
export type OnChangePage = (nextPage: number) => void;

/** Invoked when a user checks/un-checks a row */
export type OnRowSelected = ({
  eventIds,
  isSelected,
}: {
  eventIds: string[];
  isSelected: boolean;
}) => void;

/** Invoked when a user checks/un-checks the select all checkbox  */
export type OnSelectAll = ({ isSelected }: { isSelected: boolean }) => void;

/** The specification of a column header */
export type ColumnHeaderOptions = Pick<
  EuiDataGridColumn,
  | 'actions'
  | 'defaultSortDirection'
  | 'display'
  | 'displayAsText'
  | 'id'
  | 'initialWidth'
  | 'isSortable'
  | 'schema'
  | 'isExpandable'
  | 'isResizable'
> & {
  aggregatable?: boolean;
  dataTableCellActions?: DataTableCellAction[];
  category?: string;
  columnHeaderType: ColumnHeaderType;
  description?: string | null;
  esTypes?: string[];
  example?: string | number | null;
  format?: string;
  linkField?: string;
  placeholder?: string;
  subType?: IFieldSubType;
  type?: string;
};

/** Invoked when columns are updated */
export type OnUpdateColumns = (columns: ColumnHeaderOptions[]) => void;

export type SortDirection = 'none' | 'asc' | 'desc' | Direction;

export type { RowRenderer } from '@kbn/timelines-plugin/common';

/** The following props are provided to the function called by `renderCellValue` */
export type CellValueElementProps = EuiDataGridCellValueElementProps & {
  asPlainText?: boolean;
  browserFields?: BrowserFields;
  data: TimelineNonEcsData[];
  ecsData?: Ecs;
  eventId: string; // _id
  globalFilters?: Filter[];
  header: ColumnHeaderOptions;
  isDraggable: boolean;
  isTimeline?: boolean; // Default cell renderer is used for both the alert table and timeline. This allows us to cheaply separate concerns
  linkValues: string[] | undefined;
  rowRenderers?: RowRenderer[];
  setFlyoutAlert?: (data: any) => void;
  scopeId: string;
  truncate?: boolean;
  key?: string;
  closeCellPopover?: () => void;
  enableActions?: boolean;
};

export interface BulkActionsObjectProp {
  alertStatusActions?: boolean;
  onAlertStatusActionSuccess?: OnUpdateAlertStatusSuccess;
  onAlertStatusActionFailure?: OnUpdateAlertStatusError;
  customBulkActions?: CustomBulkAction[];
}

export type OnUpdateAlertStatusSuccess = (
  updated: number,
  conflicts: number,
  status: AlertWorkflowStatus
) => void;
export type OnUpdateAlertStatusError = (status: AlertWorkflowStatus, error: Error) => void;

export type BulkActionsProp = boolean | BulkActionsObjectProp;

export interface CustomBulkAction {
  key: string;
  label: string;
  disableOnQuery?: boolean;
  disabledLabel?: string;
  onClick: (items?: TimelineItem[]) => void;
  ['data-test-subj']?: string;
}

export type AlertWorkflowStatus = 'open' | 'closed' | 'acknowledged';
