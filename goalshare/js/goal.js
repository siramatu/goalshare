
// Goal singleton for storing fetched goals and paging info
var goalDetails = {
	goals: null,
	goalsPage: 1,
	goalsPerPage: 7,
	
	goal:null,
	subgoalPage: 1,
	subgoals: null,
	subgoalsPerPage:4,
	
	resetSubgoals: function(){
		this.goal = null;
		this. subgoalPage = 1;
		this.subgoals = null;
	},
	resetGoals: function(){
		this. goalPage = 1;
		this.goals = null;
	},
	goalQuery: null
};



var goalMaps = {
		centerLat: 35.1815,
		centerLng:136.9064,
		resetDetailMap: function(){
			
				this.detailMap = new google.maps.Map(document.getElementById("goal_detail-map-canvas"),
				{center: new google.maps.LatLng(this.centerLat, this.centerLng),zoom: 8});
			
			},
		setDetailMap: function(lat, lng, id){
			//console.log("lat: " + lat + " lng:" + lng);
			if(!this.detailMap)
				this.resetDetailMap();
			var loc = new google.maps.LatLng(lat, lng);
			this.detailMap.setCenter(loc);
		},
		resetCreateMap: function(){
			this.createMap = new google.maps.Map(document.getElementById("goal_create-map-canvas"),
			{center: new google.maps.LatLng(this.centerLat, this.centerLng),zoom: 8});
		},
		setCreateMap: function(lat, lng, id){
			if(!this.createMap)
				this.resetCreateMap();
			var loc = new google.maps.LatLng(lat, lng);
			this.createMap.setCenter(loc);
		}
	};

var goalsAutocomplete;

$.getJSON("/api/autocomplete.pl", { type: "goals"},
	function(data){
	goalsAutocomplete = data.goals;
	});

var usersAutocomplete;

$.getJSON("/api/autocomplete.pl", { type: "users"},
	function(data){
	usersAutocomplete = data.users;
	});
// Clear the goal edit form and set default values
function resetGoalEditSelection(){
	$("#parentGoalEdit").val("");
	$("#goalTitleEdit").val("");
	$("#goalDescriptionEdit").val("");
	$("#goalRequiredDateEdit").datepicker("setDate", new Date());
	$("#goalDesiredDateEdit").datepicker("setDate", new Date());
	$("#goalCreatedDateEdit").datepicker("setDate", new Date());
	$("#goalReferenceEdit").val("");
	$("#goalIssueId").val("");
	$('#goalLocationFilterSearch').val("");
	$('#goalLocationResults option').remove();
	$('#goalWisherEdit').val("");
	
}

// Init goal edit dialog
function goalEditInit(){
	
	$("#goalDesiredDateEdit").datepicker({
		buttonImage : "calendar.gif",
		buttonText : "Calendar",
		altFormat : "dd.mm.yy",
		dateFormat: "yy-mm-dd"
	}).datepicker("setDate", ((new Date).getDate() + 30));

	$("#goalRequiredDateEdit").datepicker({
		buttonImage : "calendar.gif",
		buttonText : "Calendar",
		altFormat : "dd.mm.yy",
		dateFormat: "yy-mm-dd"
	}).datepicker("setDate", ((new Date).getDate() + 30));
	
	$("#goalCreatedDateEdit").datepicker({
		buttonImage : "calendar.gif",
		buttonText : "Calendar",
		altFormat : "dd.mm.yy",
		dateFormat: "yy-mm-dd"
	}).datepicker("setDate", new Date());
	/* $("#goalStatusEdit").multiselect({
		height : 110,
		minWidth : 150,
		noneSelectedText : "None",
		//selectedText : "# selected",
		checkAllText : "All",
		uncheckAllText : "None",
		multiple: false
		
	});
 */	
	resetGoalEditSelection();
}

function addGoal(parentGoalURI, goalTitle, description, desiredDate, requiredDate, creator, createdDate, status, reference, issueURI, locationURI, goalWisherURI){
	var localGoalURI = "http://collab.open-opinion.org/resource/Goal/" + guid();
	$.get("/api/insert_goal.pl", { goalURI: localGoalURI,
								  parentGoalURI: parentGoalURI,
								  title: goalTitle,
								  description: description,
								  reference: reference,
								  desiredDate: desiredDate,
								  requiredDate: requiredDate,
								  creator: creator,
								  createdDate: createdDate,
								  status: status,
								  locationURI: locationURI,
								  goalWisherURI: goalWisherURI});
	if(issueURI)
		$.get("/api/issue_sollution.pl", { command: "add", goalURI: localGoalURI, issueURI: issueURI} );
}


// Opens goal edit dialog. If parent goal uri is given, it is set automatically.
function openGoalEdit(parentGoalURI, referenceURI, issueURI, title){
	resetGoalEditSelection();
	
	$("#goalEditDialogContent").dialog({
		modal: true,
		width: 'auto',
		height: 'auto',
		close: function(event, ui){
			//$("#goalEditDialogContent").show();
		 },
		 closeOnEscape: true,
		 open: function(){
			 			$("#parentGoalEdit").autocomplete({source: goalsAutocomplete });
			 			$("#goalWisherEdit").autocomplete({source: usersAutocomplete,
			 											select: function(event, ui){
					 												//console.log(event);
					 												//console.log(ui);
					 											}
			 												});
		 				},
		 buttons: [ {
			 			text: Locale.dict.Act_Create,
						click: function(){
				 			addGoal($("#parentGoalEdit").val(),
				 					$("#goalTitleEdit").val(),
				 					$("#goalDescriptionEdit").val(),
				 					(new Date( Date.parse($("#goalDesiredDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					(new Date( Date.parse($("#goalRequiredDateEdit").datepicker().val()) ).format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					user.URI,
				 					(new Date().format(Locale.dict.X_FullDateFormat)) + getTimezoneOffset(),
				 					$("#goalStatusEdit").val(),
				 					$("#goalReferenceEdit").val(),
				 					$("#goalIssueId").val(),
				 					"http://sws.geonames.org/"+$("#goalLocationResults").children("option:selected").data("geoid")+"/",
				 					$("#goalWisherEdit").val()
				 			);
							resetGoalEditSelection();
							$(this).dialog("close");
			 			}
		 			},
		 			{
		 				text: Locale.dict.Act_Cancel,
						click: function(){
			 				$(this).dialog("close");
		 				}
		 			}
		 		],
	});
	goalMaps.resetCreateMap();
	
	// Set map functionality
	$("#goalRegionEdit").keyup(function(data){
		searchGEO($("#goalRegionEdit").val(), function(data){
			if(data){
				//console.log(data);
				$("#goalLocationResults").children().remove();
				// Add select options
				for(var i = 0; i < data.geonames.length; i++){
					if( i==0 ){
						goalMaps.setCreateMap(data.geonames[i].lat,data.geonames[i].lng, null);
						
					}
					$("#goalLocationResults")
								.append(
									$("<option />").text(data.geonames[i].name)
									.attr("id", data.geonames[i].geonameId)
									.data("geoid", data.geonames[i].geonameId)
									.data("name", data.geonames[i].name)
									.data("lat", data.geonames[i].lat)
									.data("lng", data.geonames[i].lng)
									).change(function(){
										if( $(this).children("option:selected").length == 1)
											goalMaps.setCreateMap($(this).children("option:selected").data("lat"),$(this).children("option:selected").data("lng"), null);
									});
				}
			}
		});// End geo search
	});// End keyup
	
	if(parentGoalURI){
		$("#parentGoalEdit").val(parentGoalURI);
	}
	if(referenceURI){
		$("#goalReferenceEdit").val(referenceURI);
	}
	if(issueURI){
		$("#goalIssueId").val(issueURI);
	}
	if(title)
		$("#goalTitleEdit").val(title);
}


/*** GOAL Details ***/
function displaySubgoals(page){
	goalDetails.subgoalPage = page;
	if( goalDetails.subgoals && goalDetails.subgoals.length > 0 ){
		$("#subgoalsListBody").loadTemplate("templates/subgoalTemplate.html", goalDetails.subgoals, { 
					paged: true, 
					elemPerPage: goalDetails.subgoalsPerPage, 
					pageNo: page,
					isFile: true,
					success: function(){
						localizeUI();
						$(".subResource").click(function(){displayGoalDetails($(this).data("target-goal-uri"));});
						if( goalDetails.subgoals.length <= goalDetails.subgoalsPerPage * goalDetails.subgoalPage ){
							$("#subgoalsPagerNext").attr('disabled', 'disabled');
						}else{
							$("#subgoalsPagerNext").removeAttr('disabled');
						}
						if( page <= 1 )
							$("#subgoalsPagerPrev").attr('disabled', 'disabled');
						else
							$("#subgoalsPagerPrev").removeAttr('disabled');
						
					},
					errorMessage: "Error"
				});
		$("#goalSubgoalWrapper").show();
	}else{
		
	}
}

function getCollaborators(goalURI){
	$.getJSON("/api/collaborator.pl", { command: "get", goalURI: goalURI },function(data){
		
		$("#goalParticipantListBody").loadTemplate("templates/PersonTemplate.html", data.participants, {file: true});
	});
}


function getSubgoalDetails(goalURI){
	$.ajax("/api/query_subgoals.pl",{
		//async: false,
		data: { goalUrl: goalURI }
	}).done( function(data){
		var subgoalData = [];
		$.each(data.subgoals ,function(key, val){
			subgoalData.push({
				goalDetailURI: val.url,
				title: val.title,
				description: val.description,
				desiredDate: formatDate(val.desiredTargetDate),
				requiredDate: formatDate(val.requiredTargetDate),
				completedDate: formatDate(val.completedDate),
				creatorURI: val.creatorUrl,
				creator: val.creator,
				status: translateStatus(val.status),
				statusCode: val.status,
				parentGoal: val.parentGoal,
				creatorImageURI: val.creatorImageURI,
				creatorName:val.creatorName,
				wisherName: val.wisherName,
				wisherImageURI: val.wisherImageURI,
				wisherURI: val.wisherURI
			});
		});
			goalDetails.subgoals=subgoalData;
			displaySubgoals(1);
			
	});
}

function resetGoalDetails(){
	goalDetails.resetSubgoals();
	$("#goalDetailBody").children().remove();
}


// Displays goal details
function displayGoalDetails(goalURI){
	goalDetails.resetSubgoals();
	$.getJSON("/api/get_goal.pl", { goalURI: goalURI },function(data){
			if(data){
				var goalDetailURI = goalURI;
				// Goal data loaded, display template
				$("#goalDetailBody").loadTemplate("templates/goalDetailTemplate.html", { 
						goalURI: data.goal,
						title: data.goals[0].title,
						description: data.goals[0].description,
						status: (data.goals[0].status)? translateStatus(data.goals[0].status):"-",
						statusCode: (data.goals[0].status)?data.goals[0].status:"",
						statusImage: (data.goals[0].status)? translateStatusImage(data.goals[0].status):"",
						desiredDate: (data.goals[0].desiredTargetDate)? formatDate( data.goals[0].desiredTargetDate ):" -",
						requiredDate: (data.goals[0].requiredTargetDate)? formatDate(data.goals[0].requiredTargetDate ):" -",
						completedDate: (data.goals[0].completedDate)? formatDate( data.goals[0].completedDate ) : " -",
						parentGoalURI: (data.goals[0].parentGoalURI)?data.goals[0].parentGoalURI:"",
						parentGoalTitle: (data.goals[0].parentGoalTitle)?data.goals[0].parentGoalTitle:"",
						creatorURI: data.goals[0].creator,
						creatorName: data.goals[0].creatorName,
						creatorImage: data.goals[0].imageURI,
						createdDate: formatDate(data.goals[0].createdDate),
						wisherName: data.goals[0].wisherName,
						wisherImageURI: data.goals[0].wisherImageURI,
						wisherURI: data.goals[0].wisherURI						
				},{ isFile: true,
					success: function(){		
						// Set detail map
						//console.log("loc");
						//console.log(data.goals[0].locationURI);
						goalMaps.resetDetailMap();
						getGEOByURI(data.goals[0].locationURI, function(data){
							//console.log(data);
							if (data)
								goalMaps.setDetailMap(data.lat, data.lng, data.geonameId);
						});

						// Append subgoal list
						getSubgoalDetails(goalURI);
						// Append collaborators list
						getCollaborators(goalURI);
						$("#detailFindSimilarGoals").click(function(){
							$.getJSON("/api/get_similar_goals.pl", {goalURI: goalDetailURI},fetchGoalsSuccess);
							resetGoalDetails();
						});
						$(".openGoalEdit").click(function(){openGoalEdit(goalDetailURI);});
						$(".addCollaborator").click(function(){addCollaborator(goalDetailURI, user.URI );});
						$(".parentGoalLink").click(function(){displayGoalDetails($(this).data("target-goal-uri"));});
						new goalTree(goalURI, "#goal_detail_treeHolder",300,300);
					}
				});
			}
		});
	
	
}


/*** GOAL List ***/


function displayGoals(page, selectFirst){
	
	goalDetails.goalPage = page;
	if( goalDetails.goals ){
		$("#goalDataHolder").loadTemplate("templates/goalResourceTemplate.html", goalDetails.goals, { 
					paged: true, 
					elemPerPage: goalDetails.goalsPerPage, 
					pageNo: page,
					isFile: true,
					success: function(){
						localizeUI();
						if( goalDetails.goals.length <= goalDetails.goalsPerPage * goalDetails.goalPage ){
							$("#goalsPagerNext").attr('disabled', 'disabled');
						}else{
							$("#goalsPagerNext").removeAttr('disabled');
						}
						if( page <= 1 )
							$("#goalsPagerPrev").attr('disabled', 'disabled');
						else
							$("#goalsPagerPrev").removeAttr('disabled');
						
						$("div.resource.goal").click(function(){
							var goalUri = $($(this).find(".goalID")[0]).val();
							$("div.resource.goal").removeClass("selected");
							$(this).addClass("selected");
							displayGoalDetails(goalUri);
							//openGoalEdit($(this).data("goalUrl"));
						});
						
						$(".goalPath").each(function(){
							var dest = this;
							var goalURI = $( $(this).parent().find(".goalID")[0] ).val();
							$.getJSON("/api/query_goal_path.pl", { goalURI: goalURI }, function(data){
								
								var text = "";
								
						
								var currentElement = data.goalPath;
								for(var i= 0 ; i < 15 ; i++){
									// Add the >> 
									if(i > 0 )
										$(dest).append($("<span> >> </span>"));
									$(dest).append($("<span data-goaluri=\"" + currentElement.URI + "\" />")
														.addClass("selectHand")
														.css("text-decoration", "underline")
														.click(function(item){
															displayGoalDetails($(this).data("goaluri"));
															return false;
															})
											.text(currentElement.title));
									if(!currentElement.child)
										break;
									else
										currentElement = currentElement.child;
								}
								
								//$(dest).text(data.goalPath);
							});
						});
						$(".goalStatusCode").each(function(){
							var statusCode = $(this).val();
							$($(this).parent().children(".goalStatusIcon")[0]).addClass(statusCode);
						});
						if(selectFirst)
							$("#goalDataHolder > .resource.goal")[0].click();
					},
					errorMessage: "Error"
				});
	}	
}
	function fetchGoalsSuccess(data) {
		// Contains goal dom elements to be appended
		goalDetails.resetGoals();
		var goals = [];
		$.each(data.goals, function(key, val){
			var creator = userAPI.getUserByURI(val.creatorUrl);
			var wisher = userAPI.getUserByURI(val.wisherURI);
			
			goals.push({
				goalURI: val.url,
				title: val.title,
				creator: (creator!=null)?creator.personURI:"",
				creatorURI: val.creatorUrl,
				status: translateStatus(val.status),
				statusCode: val.status,
				createdDate: Locale.dict.CreatedDate + ": " + formatDate(val.createdDate),
				desiredDate: Locale.dict.DesiredDate + ": " +formatDate(val.desiredTargetDate),
				requiredDate: Locale.dict.RequiredDate + ": " +formatDate(val.requiredTargetDate),
				creatorImageURI: (creator!=null)?creator.imageURI:"/image/nobody.png",
				completedDate: val.completedDate,
				//subgoalsCount: val.cntSubgoals,
				goalPath: val.goalPath,
				imageURI: (wisher != null)? wisher.imageURI : val.creatorImageURI
			});
		});
		goalDetails.goals = goals;
		displayGoals(1, true);
	}
	
	/*** Filters ***/
	
	function setupGoalFilters() {
		var today = new Date();
		var prev = new Date();
		prev.setDate(today.getDate() - 60);

		$("#startDate").datepicker({
			buttonImage : "calendar.gif",
			buttonText : Locale.dict.Calendar,
			altFormat : "dd.mm.yy",
			dateFormat: Locale.dict.X_DateFormatJQ
		}).datepicker("setDate", prev);

		$("#endDate").datepicker({
			buttonImage : "calendar.gif",
			buttonText : Locale.dict.Calendar,
			altFormat : "dd.mm.yy",
			dateFormat: Locale.dict.X_DateFormatJQ
		}).datepicker("setDate", today);

		$("#goalStatus").multiselect({
			height : 110,
			minWidth : 150,
			noneSelectedText : Locale.dict.T_MultiSelect_None,
			selectedText : Locale.dict.T_MultiSelect_SelectedText,
			checkAllText : Locale.dict.T_MultiSelect_All,
			uncheckAllText : Locale.dict.T_MultiSelect_None
		});
		// Setup location search for the filter
		$("#goalLocationFilterSearch").keyup(function(){
			if($("#goalLocationFilterSearch").val() == "" ){
				$("#goalFilterLocation").children().remove();
			}else
				{
				searchGEO($("#goalLocationFilterSearch").val(), function(data){
					if(data){
						//console.log(data);
						$("#goalFilterLocation").children().remove();
						if($("#goalLocationFilterSearch").val() != "" ){
						for(var i = 0; i < data.geonames.length; i++){
							if( i==0 ){
								//var loc = new google.maps.LatLng(data.geonames[i].lat,data.geonames[i].lng);
								//issueCreateMap.setCenter(loc);
							}
							$("#goalFilterLocation")
										.append(
											$("<option />").text(data.geonames[i].name)
											.attr("id", data.geonames[i].geonameId)
											.data("geoid", data.geonames[i].geonameId)
											.data("value", "http://sws.geonames.org/" + data.geonames[i].geonameId)
											.data("name", data.geonames[i].name)
											.data("lat", data.geonames[i].lat)
											.data("lng", data.geonames[i].lng)
											).change(function(){
												//console.log(this);
												//var loc = new google.maps.LatLng($(this).children("option:selected").data("lat"),$(this).children("option:selected").data("lng"));
												//issueCreateMap.setCenter(loc);
											});
							}
						}
					}
				});	
			}
		});
		
		$("#createdBy").autocomplete();
		
		$.getJSON("/api/autocomplete.pl", { type: "creators" },
				function(data){
			$("#createdBy").autocomplete({source: data.Creators});
				});

		$("#goalSubmit").click(
				function() {
					if(!user.checkLoginStatus()){
						//alert(Locale.dict.AskLoginMessage);
						//return;
					}
					// Clear old goals
					$(".pagerButton").css("display", "auto");
					$("#goalDataHolder").children().remove();					
					var qData = {};
					qData["startTime"] = (new Date( Date.parse($("#startDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
					qData["endTime"] = (new Date( Date.parse($("#endDate").datepicker().val()) ).format("yyyy-MM-ddThh:mm:ss")) + getTimezoneOffset();
					qData["dateType"] = $('input:radio[name=dateType]:checked').val();
					qData["num"] = $("#resultLimit").val();
					qData["created"] = $("#createdBy").val();
					qData["keyword"] = $("#keyword").val();
					if($("#goalFilterLocation option:selected").data("value"))
						qData["locationURI"] = $("#goalFilterLocation option:selected").data("value") + "/";
					if ($("#goalStatus").val())
						qData["goalStatus"] = $("#goalStatus").val().join(";");

					if( goalDetails.goalQuery != null)
						goalDetails.goalQuery.abort();
					goalDetails.goalQueyr = $.getJSON("/api/query_goals.pl", qData,
							fetchGoalsSuccess);
			
					//.getJSON("http://localhost/cgi-bin/query_goals.pl", qData).done(fetchGoalsSuccess);
				});
	}
	function setupGoalCommands(){
		$("#goalCreate").click(function(){
			if(!user.checkLoginStatus()){
				alert(Locale.dict.AskLoginMessage);
				return;
			}
			openGoalEdit();
		});
		$("#goalsPagerNext").click(function(){
			displayGoals(goalDetails.goalPage + 1);
		});
		$("#goalsPagerPrev").click(function(){
			displayGoals(goalDetails.goalPage - 1);	
		});
		// If URL contains a command to show one goal, search one goal
//		if($.urlParam("showGoal")){
//			console.log("showinfg");
//			$(".pagerButton").css("display", "auto");
//			$("#goalDataHolder").children().remove();					
//			var qData = {};
//			qData["goalURI"] = $.urlParam("showGoal");
//			$.getJSON("/api/query_goals.pl", qData,
//					fetchGoalsSuccess);
//		}else{
			$("li.goal").click(function(){$("#goalSubmit").click();});
//		}
		
	}
