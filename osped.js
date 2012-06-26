var local = {};

$().ready(function () {
	local.gridSize = 8;
	local.subGridSize = 8;
	local.paths = new Array();
	local.oldExportStr = "";

	local.currentPath = 0;
	local.drag = -1;
	local.selectedIdx = -1;

	local.drawWidth = $("#drawAreaSource").width();
	local.drawWidth -= local.drawWidth % (local.gridSize * local.subGridSize * 2);
	local.drawHeight = $(window).height() - $("#drawAreaSource").offset().top * 3;
	local.drawHeight -= local.drawHeight % (local.gridSize * local.subGridSize * 2);

	local.centerX = local.drawWidth / 2;
	local.centerY = local.drawHeight / 2;

	local.drawArea = Raphael("drawAreaSource", local.drawWidth+1, local.drawHeight+1);
	$("#wrapper").css("float", "left");
	
	var str = "";
	for(x=0;x<local.drawWidth+1;x+=local.gridSize)
		str += "M"+(x+0.5)+",0L"+(x+0.5)+","+(local.drawHeight+1);
	for(x=0;x<local.drawHeight+1;x+=local.gridSize)
		str += "M0,"+(x+0.5)+"L"+(local.drawWidth+1)+","+(x+0.5);
	local.grid = local.drawArea.path(str).attr("stroke", "#C0C0ff");
	var str = "";
	for(x=0;x<local.drawWidth+1;x+=local.gridSize*local.subGridSize)
		str += "M"+(x+0.5)+",0L"+(x+0.5)+","+(local.drawHeight+1);
	for(x=0;x<local.drawHeight+1;x+=local.gridSize*local.subGridSize)
		str += "M0,"+(x+0.5)+"L"+(local.drawWidth+1)+","+(x+0.5);
	local.grid = local.drawArea.path(str).attr("stroke", "#A0A0ff");
	local.axes = local.drawArea.path("M0,"+(local.centerY+0.5)+"L"+(local.drawWidth+1)+","+(local.centerY+0.5)+"M"+(local.centerX+0.5)+",0L"+(local.centerX+0.5)+","+(local.drawWidth+1));
	
	local.editTool = Raphael("editToolSource", 24, 24);
	local.editTool.path("M8,3L8,20L12,17L14,23L18,20L15,15L18,13Z").attr("fill", "#E0E0E0");
	$("#editToolSource").click(function() { setSelectedTool(local.editTool); });
	local.addTool = Raphael("addToolSource", 24, 24);
	local.addTool.path("M10,2L14,2L14,10L22,10L22,14L14,14L14,22L10,22L10,14L2,14L2,10L10,10Z").attr("fill", "#80E080");
	$("#addToolSource").click(function() { setSelectedTool(local.addTool); });
	local.remTool = Raphael("remToolSource", 24, 24);
	local.remTool.path("M22,10L22,14L2,14L2,10Z").attr("fill", "#E08080");
	$("#remToolSource").click(function() { setSelectedTool(local.remTool); });
	local.imgTool = Raphael("imgToolSource", 24, 24);
	local.imgTool.path("M3,21L21,21L21,4L3,4Z");
	local.imgTool.path("M5,6L5,12L11,12L11,6Z").attr("fill", "#F08080");
	local.imgTool.circle(12,13,4).attr("fill", "#80F080");;
	local.imgTool.path("M19,19L11,19L15,13Z").attr("fill", "#8080F0");
	$("#imgToolSource").click(function() { setSelectedTool(local.imgTool); });
	
	local.editToolCorner = Raphael("editToolCorner", 24, 24);
	local.editToolCorner.path("M3,14L18,18L14,3");
	local.editToolCorner.rect(15,15,6,6);
	local.editToolSmooth = Raphael("editToolSmooth", 24, 24);
	local.editToolSmooth.path("M1,12C16,22 22,16 12,1");
	local.editToolSmooth.rect(13,13,6,6);
	local.editToolSmooth.path("M21,11L11,21");
	local.editToolSmooth.rect(8,18,6,6);
	local.editToolSmooth.rect(18,8,6,6);
	
	setSelectedTool(local.editTool);
	
	$("#editToolCorner").click(function () {
		if (local.selectedIdx < 0) return;
		local.paths[local.currentPath].points[local.selectedIdx].type = 0;
		local.paths[local.currentPath].points[local.selectedIdx].prevCP = {x: 0, y: 0};
		local.paths[local.currentPath].points[local.selectedIdx].nextCP = {x: 0, y: 0};
		updatePath(local.paths[local.currentPath]);
		showSelectedCP();
	});
	$("#editToolSmooth").click(function () {
		if (local.selectedIdx < 0) return;
		local.paths[local.currentPath].points[local.selectedIdx].type = 1;
		local.paths[local.currentPath].points[local.selectedIdx].prevCP = {x:-2, y:-2};
		local.paths[local.currentPath].points[local.selectedIdx].nextCP = {x: 2, y: 2};
		updatePath(local.paths[local.currentPath]);
		showSelectedCP();
	});

	$("#pathListbox").prop("selectedIndex", 0);
	$("#pathListbox").change(function() {
		if (local.paths[local.currentPath] != undefined)
		{
			for(var i=0; i<local.paths[local.currentPath].points.length; i++)
			{
				if (local.paths[local.currentPath].points[i].box != undefined)
					local.paths[local.currentPath].points[i].box.remove();
				local.paths[local.currentPath].points[i].box = undefined;
			}
			local.paths[local.currentPath].path.attr("stroke-width", 2);
		}
		local.currentPath = $("#pathListbox").prop("selectedIndex");
		local.selectedIdx = -1;
		if (local.paths[local.currentPath] != undefined)
		{
			for(var i=0; i<local.paths[local.currentPath].points.length; i++)
			{
				if (local.paths[local.currentPath].points[i].box != undefined)
					local.paths[local.currentPath].points[i].box.remove();
				local.paths[local.currentPath].points[i].box = local.drawArea.rect(toX(local.paths[local.currentPath].points[i].x) - local.gridSize / 2, toY(local.paths[local.currentPath].points[i].y) - local.gridSize / 2, local.gridSize, local.gridSize);
			}
			local.paths[local.currentPath].path.attr("stroke-width", 3);
		}
	});
	$("#exportArea").keyup(function() {
		var str = $("#exportArea").val();
		if (str == local.oldExportStr) return;
		
		local.oldExportStr = str;
		
		for(var i=0; i<local.paths.length; i++)
		{
			for(var j=0; j<local.paths[i].points.length; j++)
			{
				if (local.paths[i].points[j].box != undefined)
					local.paths[i].points[j].box.remove();
			}
			local.paths[i].path.remove();
		}
		local.paths = new Array();
		local.selectedIdx = -1;
		optionStr = "";
		
		var startIdx = str.indexOf("[[");
		var p = 0;
		var prevEnd = 0;
		while (startIdx > -1)
		{
			var endIdx = str.indexOf("]]", startIdx);
			if (endIdx > -1)
			{
				local.paths[p] = {points: new Array(), prefix: str.substr(prevEnd, startIdx - prevEnd), postfix: ""};
				prevEnd = endIdx + 2;
				var polyString = str.substr(startIdx + 2, endIdx - startIdx - 2).split("],[");
				for(var i=0;i<polyString.length;i++)
				{
					var n = polyString[i].split(",");
					var x = parseInt(n[0]);
					var y = parseInt(n[1]);
					local.paths[p].points.push({x: x, y: y, type: 0, nextCP: {x: 0, y: 0}, prevCP: {x: 0, y: 0}});
					if (polyString[i].indexOf("/*") > 0)
					{
						var point = local.paths[p].points[local.paths[p].points.length - 1];
						var extra = polyString[i].substr(polyString[i].indexOf("/*") + 2);
						extra = extra.substr(0, extra.length - 2);
						n = extra.split(":");
						point.type = parseInt(n[0]);
						n = n[1].split(",");
						point.prevCP = {x: parseInt(n[0]), y: parseInt(n[1])};
						point.nextCP = {x: parseInt(n[2]), y: parseInt(n[3])};
					}
				}
				local.paths[p].path = local.drawArea.path("").attr("stroke-width", 2);
				updatePath(local.paths[p]);
				p++;
				optionStr += "<option>Path:" + p;
			}
			startIdx = str.indexOf("[[", startIdx + 1);
		}
		if (p > 0)
			local.paths[p-1].postfix = str.substr(prevEnd);
		
		optionStr += "<option>[New]";
		$("#pathListbox").html(optionStr);
		$("#pathListbox").prop("selectedIndex", 0);
		local.currentPath = 0;
		$("#pathListbox").change();
	});
	
	//Functionality for loading an image behind the grid to trace over.
	$("#traceImageURL").keyup(function() {
		$("#traceImage").attr("src", $("#traceImageURL").val());
	});
	$("#traceImageScale").keyup(function () {
		$("#traceImage").css("width", "");
		$("#traceImage").css("width", $("#traceImage").width() * parseInt($("#traceImageScale").val()) / 100);
		$("#traceImage").css("left", local.centerX - $("#traceImage").width() / 2 + $("#drawAreaSource").offset().left);
		$("#traceImage").css("top", local.centerY - $("#traceImage").height() / 2 + $("#drawAreaSource").offset().top);
	});
	$("#traceImage").load(function () {
		$("#traceImage").css("width", "");
		$("#traceImage").css("width", $("#traceImage").width() * parseInt($("#traceImageScale").val()) / 100);
		$("#traceImage").css("left", local.centerX - $("#traceImage").width() / 2 + $("#drawAreaSource").offset().left);
		$("#traceImage").css("top", local.centerY - $("#traceImage").height() / 2 + $("#drawAreaSource").offset().top);
	});
	
	//Test if we have the FileReader class, which can read files from your local disk (by using the file upload input field)
	if (typeof(FileReader) != "function")
	{
		$("#traceImageFileSpan").css("display", "none");
	}else{
		local.imageFilter = /^(image\/bmp|image\/cis-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x-cmu-raster|image\/x-cmx|image\/x-icon|image\/x-portable-anymap|image\/x-portable-bitmap|image\/x-portable-graymap|image\/x-portable-pixmap|image\/x-rgb|image\/x-xbitmap|image\/x-xpixmap|image\/x-xwindowdump)$/i;
		local.fileReader = new FileReader();
		$("#traceImageFile").change(function() {
			var files = $("#traceImageFile").prop("files");
			if (files.length === 0) { return; }  
			if (!local.imageFilter.test(files[0].type))
			{
				alert("You must select a valid image file!");
				return;
			}
			local.fileReader.readAsDataURL(files[0]);
		});
		local.fileReader.onload = function (e)
		{
			$("#traceImage").attr("src", e.target.result);
		};
	}
	
	// Make the toolbox dragable
	$(".toolboxtitle").mousedown(function (e) {
		var toolbox = $("#toolbox");
		toolbox.prop("dragX", e.pageX);
		toolbox.prop("dragY", e.pageY);
		
	});
	$(document).mousemove(function (e) {
		var toolbox = $("#toolbox");
		if (toolbox.prop("dragX") != undefined)
		{
			toolbox.css("left", toolbox.offset().left + (e.pageX - toolbox.prop("dragX")));
			toolbox.css("top", toolbox.offset().top + (e.pageY - toolbox.prop("dragY")));
			toolbox.prop("dragX", e.pageX);
			toolbox.prop("dragY", e.pageY);
		}
	});
	$(".toolboxtitle").mouseup(function (e) {
		var toolbox = $("#toolbox");
		toolbox.removeProp("dragX");
	});

	//Fire the keyup event so if any text is filled in by the browser (on refresh for example) then we will show that
	$("#exportArea").keyup();
	$("#traceImageURL").keyup();
});

function eventOnDrawArea(e)
{
	if (local.drawArea == undefined) return false;
	var das = $("#drawAreaSource");
	var toolbox = $("#toolbox");
	if (e.pageX < das.offset().left) return false;
	if (e.pageY < das.offset().top) return false;
	if (e.pageX > das.offset().left + local.drawWidth) return false;
	if (e.pageY > das.offset().top + local.drawHeight) return false;
	if (e.pageX >= toolbox.offset().left && e.pageX <= toolbox.offset().left + toolbox.width() && 
		e.pageY >= toolbox.offset().top && e.pageY <= toolbox.offset().top + toolbox.height()) return false;
	if (e.preventDefault) e.preventDefault();
	e.stopPropagation();
	e.x = Math.round(((e.pageX - das.offset().left) - local.centerX) / local.gridSize);
	e.y = -Math.round(((e.pageY - das.offset().top) - local.centerY) / local.gridSize);
	return true;
}

function toX(x) { return x * local.gridSize + local.centerX; }
function toY(y) { return -y * local.gridSize + local.centerY; }

function updatePath(path)
{
	var points = path.points;
	var str = "";
	if (points.length > 1)
	{
		var p0 = points[points.length-1];
		str += "M" + toX(p0.x) + "," + toY(p0.y);
		for(var i=0; i<points.length; i++)
		{
			var p1 = points[i];
			if (p0.type == 1 || p1.type == 1)
			{
				var x1 = p0.x + p0.nextCP.x;
				var y1 = p0.y + p0.nextCP.y;
				var x2 = p1.x + p1.prevCP.x;
				var y2 = p1.y + p1.prevCP.y;
				str += "C" + toX(x1) + "," + toY(y1) + " " + toX(x2) + "," + toY(y2) + " " + toX(p1.x) + "," + toY(p1.y);
			}else{
				str += "L" + toX(p1.x) + "," + toY(p1.y);
			}
			var p0 = p1;
		}
		str += "Z";
	}
	path.path.attr("path", str);
}

function showSelectedCP()
{
	if (local.nextCPbox != undefined)
	{
		local.nextCPbox.remove();
		local.nextCPbox = undefined;
		local.prevCPbox.remove();
		local.prevCPbox = undefined;
	}
	if (local.selectedIdx < 0) return;
	var p = local.paths[local.currentPath].points[local.selectedIdx];
	if (p.type == 1)
	{
		local.nextCPbox = local.drawArea.rect(toX(p.x + p.nextCP.x) - local.gridSize / 2, toY(p.y + p.nextCP.y) - local.gridSize / 2, local.gridSize, local.gridSize).attr("stroke", "#8080FF");
		local.prevCPbox = local.drawArea.rect(toX(p.x + p.prevCP.x) - local.gridSize / 2, toY(p.y + p.prevCP.y) - local.gridSize / 2, local.gridSize, local.gridSize).attr("stroke", "#8080FF");
	}
}

function interpolate(p0, p1, f)
{
	return {x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f};
}

function distance(p0, p1)
{
	return Math.sqrt((p0.x-p1.x)*(p0.x-p1.x) + (p0.y-p1.y)*(p0.y-p1.y));
}

function updateExport()
{
	var maxInterpolateSteps = 100;
	var str = "";
	for(var i=0; i<local.paths.length; i++)
	{
		str += local.paths[i].prefix + "[";
		if (local.paths[i].points.length > 0)
		{
			for(var j=0; j<local.paths[i].points.length; j++)
			{
				var p0 = local.paths[i].points[j];
				var p1 = local.paths[i].points[(j+1)%local.paths[i].points.length];
				str += "[" + p0.x + "," + p0.y;
				if (p0.type == 1 || p1.type == 1)
				{
					var q0 = {x: p0.x + p0.nextCP.x, y: p0.y + p0.nextCP.y};
					var q1 = {x: p1.x + p1.prevCP.x, y: p1.y + p1.prevCP.y};
					var prevPoint = p0;
					str += "/*1:" + p0.prevCP.x + "," + p0.prevCP.y + "," + p0.nextCP.x + "," + p0.nextCP.y + "*/";
					for(var n=1;n<maxInterpolateSteps;n+=1)
					{
						var k = n / maxInterpolateSteps;
						//The space makes these points not be used when generating the path again from code.
						var r0 = interpolate(p0, q0, k);
						var r1 = interpolate(q0, q1, k);
						var r2 = interpolate(q1, p1, k);
						var b0 = interpolate(r0, r1, k);
						var b1 = interpolate(r1, r2, k);
						var s = interpolate(b0, b1, k);
						if (distance(s, prevPoint) >= 1)
						{
							prevPoint = s;
							str += "] ,[";
							str += (Math.round(s.x * 100) / 100) + "," + (Math.round(s.y * 100) / 100)
						}
					}
				}
				str += "]";
				if (j < local.paths[i].points.length - 1)
					str += ",";
			}
		}else{
			str += "[]";
		}
		str += "]" + local.paths[i].postfix;
	}
	$("#exportArea").val(str);
	local.oldExportStr = str;
}

$(document).mousedown(function(e) {
	if (!eventOnDrawArea(e)) return;
	local.drag = -1;
	
	if (local.currentTool == local.addTool)
	{
		if (local.paths.length <= local.currentPath)
		{	//New path
			$('#pathListbox option:eq('+local.currentPath+')').text('Path:' + (local.currentPath + 1));
			$('#pathListbox').append($('<option>').text("[New]")); 
			local.paths[local.currentPath] = {points: new Array(), prefix: "polygon(", postfix: ");\n"};
		}
		var box = local.drawArea.rect(toX(e.x) - local.gridSize / 2, toY(e.y) - local.gridSize / 2, local.gridSize, local.gridSize);
		local.paths[local.currentPath].points.push({x: e.x, y: e.y, type: 0, box: box, prevCP: {x: 0, y: 0}, nextCP: {x: 0, y: 0}});
		if (local.paths[local.currentPath].path == undefined)
			local.paths[local.currentPath].path = local.drawArea.path("").attr("stroke-width", 3);
		updatePath(local.paths[local.currentPath]);
		updateExport();
	}
	
	if (local.currentTool == local.editTool)
	{
		if (local.paths[local.currentPath] == undefined) return;
		
		if (local.selectedIdx > -1 && local.paths[local.currentPath].points[local.selectedIdx].type == 1)
		{
			var p = local.paths[local.currentPath].points[local.selectedIdx];
			if (p.nextCP.x + p.x == e.x && p.nextCP.y + p.y == e.y)
			{
				local.dragType = 1;
				local.drag = local.selectedIdx;
				return;
			}
			if (p.prevCP.x + p.x == e.x && p.prevCP.y + p.y == e.y)
			{
				local.dragType = 2;
				local.drag = local.selectedIdx;
				return;
			}
		}
		
		for(var i=0;i<local.paths[local.currentPath].points.length;i++)
		{
			if (local.paths[local.currentPath].points[i].x == e.x && local.paths[local.currentPath].points[i].y == e.y)
			{
				if (local.selectedIdx > -1)
					local.paths[local.currentPath].points[local.selectedIdx].box.attr("stroke", "#000000");

				local.drag = i;
				local.dragType = 0;
				local.selectedIdx = i;
				local.paths[local.currentPath].points[local.selectedIdx].box.attr("stroke", "#ff0000");
				showSelectedCP();
			}
		}
	}
	
	if (local.currentTool == local.remTool)
	{
		if (local.paths[local.currentPath] == undefined) return;
		
		for(var i=0;i<local.paths[local.currentPath].points.length;i++)
		{
			if (local.paths[local.currentPath].points[i].x == e.x && local.paths[local.currentPath].points[i].y == e.y)
			{
				local.paths[local.currentPath].points[i].box.remove();
				local.paths[local.currentPath].points.splice(i, 1);
			}
		}
		updatePath(local.paths[local.currentPath]);
		updateExport();
	}
});
$(document).mousemove(function(e) {
	if (!eventOnDrawArea(e)) return;

	$('#cursorCoordinates').text('x = '+e.x + ', y = ' + e.y);
	
	if (local.currentTool == local.editTool)
	{
		if (local.drag != -1)
		{
			var p = local.paths[local.currentPath].points[local.drag];
			switch(local.dragType)
			{
			case 0:
				p.x = e.x;
				p.y = e.y;
				p.box.attr({x: toX(e.x) - local.gridSize / 2, y: toY(e.y) - local.gridSize / 2});
				break;
			case 1:
				p.nextCP.x = e.x - p.x;
				p.nextCP.y = e.y - p.y;
				break;
			case 2:
				p.prevCP.x = e.x - p.x;
				p.prevCP.y = e.y - p.y;
				break;
			}
			updatePath(local.paths[local.currentPath]);
			showSelectedCP();
			updateExport();
		}
	}
});
$(document).mouseup(function(e) {
	local.drag = -1;
	if (!eventOnDrawArea(e)) return;
});

function setSelectedTool(tool)
{
	if (local.currentToolSelection != undefined)
		local.currentToolSelection.remove();
	local.currentTool = tool;
	local.currentToolSelection = local.currentTool.path("M0.5,0.5L0.5,23.5L23.5,23.5L23.5,0.5Z");
	local.selectedIdx = -1;
	if (local.currentTool == local.imgTool)
		$("#imageToolOptions").css("display", "");
	else
		$("#imageToolOptions").css("display", "none");
	if (local.currentTool == local.editTool)
		$("#editToolOptions").css("display", "");
	else
		$("#editToolOptions").css("display", "none");
}
