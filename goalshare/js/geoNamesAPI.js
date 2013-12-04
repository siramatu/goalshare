
function searchGEO(name, callback){
	$.ajax({
		url: "http://ws.geonames.org/searchJSON",
		// the name of the callback parameter, as specified by the YQL service
		jsonp: "callback",
		// tell jQuery we're expecting JSONP
		dataType: "jsonp",
		// tell YQL what we want and that we want JSON
		data: {
			//q:"Kuopio",
			name_startsWith: name,
			maxRows:200,
			format: "json"
		},
		// work with the response
		success:callback
	});
}
function getGEOByURI(uri, callback){
	if(!uri)
		return;
	var id = uri.match(/[0-9]+/)[0];
	if( id )
		getGEOByID(id, callback);
}
function getGEOByID(id, callback){
	console.log(id);
	//:http://api.geonames.org/getJSON?formatted=true&geonameId=6295630&username=demo&style=full
	$.ajax({
		url: "http://ws.geonames.org/getJSON",
		jsonp: "callback",
		dataType: "jsonp",
		// tell YQL what we want and that we want JSON
		data: {
			//q:"Kuopio",
			formatted: "true",
			geonameId: id,
			style: "full",
			format: "json"
		},
		// work with the response
		success:callback
	});
}

function searchGEONLP(name){
	var result = {};
	$.ajax({url:'http://localhost/api/geonlp.pl',
		async:false,	
		data: {name: name },
		success: function(data){result = data;}
	
			});
	return result;
}

function getNLPLocations(name){
	var res = searchGEONLP(name);
	for( var i = 0; i < res.result.length; i++ ){
		if(res.result[i].geo){
			console.log("point:");
			console.log("name: " + res.result[i].geo.properties.name  +"Lat: " + res.result[i].geo.geometry.coordinates[0] + "Lat: " + res.result[i].geo.geometry.coordinates[1] );
		}
	}
}