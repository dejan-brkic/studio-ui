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

import React, { useEffect, useState } from 'react';
import { QuickCreateMenu } from '../modules/Preview/QuickCreate';
import { useSelection } from '../utils/hooks';

export default function(props) {
  const { anchorEl, previewItem, onClose } = props;
  const [menuAnchor, setMenuAnchor] = useState(anchorEl);
  const createNewContentOpen = useSelection(state => state.dialogs.newContent.open);
// TODO: Switch when Embedded legacy editors is moved to dialog manager
// const editFormOpen = useSelection(state => state.dialogs.edit.open);
  const editFormOpen = false;

  const onCloseMenu = () => setMenuAnchor(null);

  useEffect(() => {
    if (!menuAnchor && !createNewContentOpen && !editFormOpen) {
      onClose();
    }
  }, [menuAnchor, createNewContentOpen, editFormOpen, onClose]);

  return (
    <QuickCreateMenu anchorEl={menuAnchor} previewItem={previewItem} onClose={onCloseMenu} onItemClicked={onCloseMenu} />
  )
}