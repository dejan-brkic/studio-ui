CStudioSearch.ResultRenderer.Default = {
	render: function(contentTO) {
		var liveUrl = CStudioAuthoringContext.liveAppBaseUri + contentTO.item.browserUri;

		if (!CStudioAuthoring.Utils.isEmpty(contentTO.item.contentType)) {
			var ctype = contentTO.item.contentType;
		}

		var contentType = CStudioSearch.getContentTypeName(contentTO.item.contentType);
		
		var onPreviewCode = "Page" === contentType ? "CStudioAuthoring.Service.lookupContentItem('" +
		                    CStudioAuthoringContext.site + 
		                    "', '" +  
		                    contentTO.item.uri +"', " +
		                    "{ success:function(to) { CStudioAuthoring.Operations.openPreview(to.item, '" + 
		                    window.id +
		                    "', false, false); }, failure: function() {} }, false); return false;" : "";

		var result = 
			"<a href='#' " +
				"onclick=\"" + onPreviewCode + "\" " +
				"class='" + ((contentTO.item && "Component" === contentType) ? "cstudio-search-no-preview":"cstudio-search-download-link") +
			       	"'>"+contentTO.item.internalName+(contentTO.item.newFile?"*":"")+"</a>" +
				"<span class='cstudio-search-download-link-additional'>  " + 
					contentType +
				"</span>" +
				"<br />"+
				"<div class='cstudio-search-result-detail'>";
					
					if(contentTO.item.previewable && contentTO.item.previewable == true) {
						result +=
							"<div>"+liveUrl+"</div>"
					}
					
				
		return CStudioSearch.renderCommonResultWrapper(contentTO, result);
	}
};

// register renderer
CStudioSearch.resultRenderers["default"] = CStudioSearch.ResultRenderer.Default;
CStudioAuthoring.Module.moduleLoaded("search-result-default", CStudioSearch.resultRenderers["default"]);