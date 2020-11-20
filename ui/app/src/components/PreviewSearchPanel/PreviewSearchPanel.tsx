/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import {
  useActiveSiteId,
  useContentTypeList,
  useDebouncedInput,
  useLogicResource,
  useMount,
  useSubject
} from '../../utils/hooks';
import SearchBar from '../Controls/SearchBar';
import { ComponentsContentTypeParams, ElasticParams, SearchItem, SearchResult } from '../../models/Search';
import { SuspenseWithEmptyState } from '../SystemStatus/Suspencified';
import { DraggablePanelListItem } from '../../modules/Preview/Tools/DraggablePanelListItem';
import TablePagination from '@material-ui/core/TablePagination';
import { getHostToGuestBus } from '../../modules/Preview/previewContext';
import {
  ASSET_DRAG_ENDED,
  ASSET_DRAG_STARTED,
  COMPONENT_INSTANCE_DRAG_ENDED,
  COMPONENT_INSTANCE_DRAG_STARTED
} from '../../state/actions/preview';
import ContentInstance from '../../models/ContentInstance';
import { search } from '../../services/search';
import { ApiResponse } from '../../models/ApiResponse';
import { Resource } from '../../models/Resource';
import { createLookupTable } from '../../utils/object';
import { getContentInstance } from '../../services/content';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';

const translations = defineMessages({
  previewSearchPanelTitle: {
    id: 'previewSearchPanel.title',
    defaultMessage: 'Search'
  },
  previousPage: {
    id: 'pagination.previousPage',
    defaultMessage: 'Previous page'
  },
  nextPage: {
    id: 'pagination.nextPage',
    defaultMessage: 'Next page'
  }
});

const useStyles = makeStyles(() => ({
  searchContainer: {
    padding: '16px'
  },
  paginationContainer: {
    padding: '0 16px'
  },
  searchResultsList: {
    padding: '0',
    '& li:first-child': {
      paddingTop: 0
    }
  },
  pagination: {
    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
    '& p': {
      padding: 0
    },
    '& svg': {
      top: 'inherit'
    },
    '& .hidden': {
      display: 'none'
    }
  },
  toolbar: {
    padding: 0,
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: '12px',
    '& .MuiTablePagination-spacer': {
      display: 'none'
    },
    '& .MuiTablePagination-spacer + p': {
      display: 'none'
    }
  }
}));

interface SearchResultsProps {
  resource: Resource<SearchItem[]>;
  onDragStart(item: SearchItem): void;
  onDragEnd(item: SearchItem): void;
}

function SearchResults(props: SearchResultsProps) {
  const { resource, onDragStart, onDragEnd } = props;
  const items = resource.read();
  const classes = useStyles({});

  return (
    <List className={classes.searchResultsList}>
      {items.map((item: SearchItem) => (
        <DraggablePanelListItem
          key={item.path}
          primaryText={item.name}
          avatarSrc={item.type === 'Image' ? item.path : null}
          onDragStart={() => onDragStart(item)}
          onDragEnd={() => onDragEnd(item)}
        />
      ))}
    </List>
  );
}

const initialSearchParameters: Partial<ElasticParams> = {
  keywords: '',
  offset: 0,
  limit: 10,
  orOperator: true
  // sortBy: '_score',
  // sortOrder: 'desc',
  // filters: {}
};

const mimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'image/svg+xml'];

export default function PreviewSearchPanel() {
  const classes = useStyles({});
  const { formatMessage } = useIntl();
  const [contentInstanceLookup, setContentInstanceLookup] = useState({});
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState<ApiResponse>(null);
  const site = useActiveSiteId();
  const hostToGuest$ = getHostToGuestBus();
  const [searchResults, setSearchResults] = useState<SearchResult>(null);
  const contentTypes = useContentTypeList(
    (contentType) => contentType.id !== '/component/level-descriptor' && contentType.type === 'component'
  );
  const contentTypesLookup = useMemo(() => (contentTypes ? createLookupTable(contentTypes, 'id') : null), [
    contentTypes
  ]);

  const unMount$ = useSubject();
  const [pageNumber, setPageNumber] = useState(0);

  const resource = useLogicResource<SearchItem[], SearchResult>(searchResults, {
    shouldResolve: (data) => Boolean(data),
    shouldReject: () => Boolean(error),
    shouldRenew: (data, resourceArg) => resourceArg.complete,
    resultSelector: (data) => data.items,
    errorSelector: () => error
  });

  const onSearch = useCallback(
    (keywords: string = '', options?: ComponentsContentTypeParams) => {
      // pipe(takeUntil(unMount$),switchMap())
      search(site, {
        ...initialSearchParameters,
        keywords,
        ...options,
        filters: { 'content-type': contentTypes?.map((item) => item.id), 'mime-type': mimeTypes }
      })
        .pipe(
          takeUntil(unMount$),
          switchMap((result) => {
            const requests: Array<Observable<ContentInstance>> = [];
            result.items.forEach((item) => {
              if (item.type === 'Component') {
                requests.push(getContentInstance(site, item.path, contentTypesLookup));
              }
            });
            return requests.length
              ? forkJoin(requests).pipe(map((contentInstances) => ({ contentInstances, result })))
              : of({ result, contentInstances: null });
          })
        )
        .subscribe(
          (response) => {
            setSearchResults(response.result);
            if (response.contentInstances) {
              setContentInstanceLookup(createLookupTable(response.contentInstances, 'craftercms.path'));
            }
          },
          ({ response }) => {
            setError(response);
          }
        );
    },
    [site, contentTypes, unMount$, contentTypesLookup]
  );

  useMount(() => {
    return () => {
      unMount$.next();
      unMount$.complete();
    };
  });

  useEffect(() => {
    if (contentTypes && contentTypesLookup) {
      onSearch();
    }
  }, [contentTypes, contentTypesLookup, onSearch]);

  const onSearch$ = useDebouncedInput(onSearch, 400);

  function handleSearchKeyword(keyword: string) {
    setKeyword(keyword);
    onSearch$.next(keyword);
  }

  function onPageChanged(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, page: number) {
    setPageNumber(page);
    onSearch(keyword, {
      offset: page * initialSearchParameters.limit,
      limit: initialSearchParameters.limit
    });
  }

  const onDragStart = (item: SearchItem) => {
    if (item.type === 'Component') {
      const instance: ContentInstance = contentInstanceLookup[item.path];
      hostToGuest$.next({
        type: COMPONENT_INSTANCE_DRAG_STARTED,
        payload: { instance, contentType: contentTypesLookup[instance.craftercms.contentTypeId] }
      });
    } else {
      hostToGuest$.next({
        type: ASSET_DRAG_STARTED,
        payload: item
      });
    }
  };

  const onDragEnd = (item: SearchItem) => {
    hostToGuest$.next({
      type: item.type === 'Component' ? COMPONENT_INSTANCE_DRAG_ENDED : ASSET_DRAG_ENDED
    });
  };

  return (
    <>
      <div className={classes.searchContainer}>
        <SearchBar
          keyword={keyword}
          placeholder={formatMessage(translations.previewSearchPanelTitle)}
          onChange={(keyword) => handleSearchKeyword(keyword)}
          showDecoratorIcon={true}
          showActionButton={Boolean(keyword)}
        />
      </div>
      {searchResults && (
        <div className={classes.paginationContainer}>
          <TablePagination
            className={classes.pagination}
            classes={{ root: classes.pagination, selectRoot: 'hidden', toolbar: classes.toolbar }}
            component="div"
            labelRowsPerPage=""
            count={searchResults['count'] || searchResults['total']}
            rowsPerPage={initialSearchParameters.limit}
            page={pageNumber}
            backIconButtonProps={{
              'aria-label': formatMessage(translations.previousPage),
              size: 'small'
            }}
            nextIconButtonProps={{
              'aria-label': formatMessage(translations.nextPage),
              size: 'small'
            }}
            onChangePage={(e: React.MouseEvent<HTMLButtonElement>, page: number) => onPageChanged(e, page)}
          />
        </div>
      )}
      <SuspenseWithEmptyState resource={resource}>
        <SearchResults resource={resource} onDragStart={onDragStart} onDragEnd={onDragEnd} />
      </SuspenseWithEmptyState>
    </>
  );
}
