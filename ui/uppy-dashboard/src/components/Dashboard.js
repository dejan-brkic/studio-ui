const FileList = require('./FileList');
const AddFiles = require('@uppy/dashboard/lib/components/AddFiles');
const AddFilesPanel = require('@uppy/dashboard/lib/components/AddFilesPanel');
const PickerPanelContent = require('@uppy/dashboard/lib/components/PickerPanelContent');
const EditorPanel = require('@uppy/dashboard/lib/components/EditorPanel');
const PanelTopBar = require('./PickerPanelTopBar');
const FileCard = require('@uppy/dashboard/lib/components/FileCard');
const Slide = require('@uppy/dashboard/lib/components/Slide');
const classNames = require('classnames');
const isDragDropSupported = require('@uppy/utils/lib/isDragDropSupported');
const { h } = require('preact');

// http://dev.edenspiekermann.com/2016/02/11/introducing-accessible-modal-dialog
// https://github.com/ghosh/micromodal

const WIDTH_XL = 900;
const WIDTH_LG = 700;
const WIDTH_MD = 576;
const HEIGHT_MD = 400;

module.exports = function Dashboard(props) {
  const noFiles = props.totalFileCount === 0;
  const isSizeMD = props.containerWidth > WIDTH_MD;

  const wrapperClassName = classNames({
    'uppy-Root': props.isTargetDOMEl
  });

  const dashboardClassName = classNames({
    'uppy-Dashboard': true,
    'uppy-Dashboard--animateOpenClose': props.animateOpenClose,
    'uppy-Dashboard--isClosing': props.isClosing,
    'uppy-Dashboard--isDraggingOver': props.isDraggingOver,
    'uppy-Dashboard--modal': !props.inline,
    'uppy-size--md': props.containerWidth > WIDTH_MD,
    'uppy-size--lg': props.containerWidth > WIDTH_LG,
    'uppy-size--xl': props.containerWidth > WIDTH_XL,
    'uppy-size--height-md': props.containerHeight > HEIGHT_MD,
    'uppy-Dashboard--isAddFilesPanelVisible': props.showAddFilesPanel,
    'uppy-Dashboard--isInnerWrapVisible': props.areInsidesReadyToBeVisible
  });

  // Important: keep these in sync with the percent width values in `src/components/FileItem/index.scss`.
  let itemsPerRow = 1;

  const showFileList = props.showSelectedFiles && !noFiles;

  const dashboard = (
    <div
      class={dashboardClassName}
      data-uppy-theme={props.theme}
      data-uppy-num-acquirers={props.acquirers.length}
      data-uppy-drag-drop-supported={isDragDropSupported()}
      aria-hidden={props.inline ? 'false' : props.isHidden}
      aria-label={!props.inline ? props.i18n('dashboardWindowTitle') : props.i18n('dashboardTitle')}
      onpaste={props.handlePaste}
      onDragOver={props.handleDragOver}
      onDragLeave={props.handleDragLeave}
      onDrop={props.handleDrop}
    >
      <div class="uppy-Dashboard-overlay" tabindex={-1} onclick={props.handleClickOutside} />

      <div
        class="uppy-Dashboard-inner"
        aria-modal={!props.inline && 'true'}
        role={!props.inline && 'dialog'}
        style={{
          width: props.inline && props.width ? props.width : '',
          height: props.inline && props.height ? props.height : ''
        }}
      >
        {!props.inline ? (
          <button
            class="uppy-u-reset uppy-Dashboard-close"
            type="button"
            aria-label={props.i18n('closeModal')}
            title={props.i18n('closeModal')}
            onclick={props.closeModal}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        ) : null}

        <div class="uppy-Dashboard-innerWrap">
          <div class="uppy-Dashboard-dropFilesHereHint">{props.i18n('dropHint')}</div>
          {showFileList ? (
            <FileList {...props} itemsPerRow={itemsPerRow} />
          ) : (
            <AddFiles {...props} isSizeMD={isSizeMD} />
          )}

          <Slide>
            {props.showAddFilesPanel ? <AddFilesPanel key="AddFiles" {...props} isSizeMD={isSizeMD} /> : null}
          </Slide>

          <Slide>{props.fileCardFor ? <FileCard key="FileCard" {...props} /> : null}</Slide>

          <Slide>{props.activePickerPanel ? <PickerPanelContent key="Picker" {...props} /> : null}</Slide>

          <Slide>{props.showFileEditor ? <EditorPanel key="Editor" {...props} /> : null}</Slide>

          {showFileList && <PanelTopBar {...props} />}
        </div>
      </div>
    </div>
  );

  return (
    // Wrap it for RTL language support
    <div class={wrapperClassName} dir={props.direction}>
      {dashboard}
    </div>
  );
};
