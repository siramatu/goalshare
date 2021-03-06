use utf8;
use Encode;
use URI::Escape;
use JSON qw/encode_json decode_json/;
use CGI;
use HTTP::Request::Common;
use LWP::UserAgent;
use URI;

my $endpoint_auth = URI->new("http://collab.open-opinion.org/sparql-auth");
my $endpoint = URI->new("http://collab.open-opinion.org/sparql");
#my $endpoint = URI->new("http://collab.open-opinion.org/sparql-auth");

$SPARQL_PREFIX =
    "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n". 
    "PREFIX dc: <http://purl.org/dc/terms/>\n".
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n".
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n".
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n".
    "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n".
    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n";

sub execute_sparul {
    my $sparql = $_[0];
    my $graph_uri = $_[1];
    
    my $uri = URI->new($endpoint_auth);
    $uri->query_form(
	"query" => $sparql, 
	"format" => "application/sparql-results+json",
	"default-graph-uri" => $graph_uri,
	"timeout" => 0,
	"debug" => "on");

    my $url = $uri->as_string;
    my $wget_cmd = "wget -O - --header=\"Accept: text/html,application/sparql-results+json\" --http-user=socia --http-passwd=publicconcerns \"$url\"";
    #print "$wget_cmd\n";
    my $response = `$wget_cmd`;
    if ($response) {
	return $response;
    } else {
	return '{"results":{}}';
    }

}

sub execute_sparql {
    my $sparql = $_[0];
    my $graph_uri = $_[1];
    
    my $uri = URI->new($endpoint);
    $uri->query_form(
	"query" => $sparql, 
	"format" => "application/sparql-results+json",
	"default-graph-uri" => $graph_uri,
	"timeout" => 0,
	"debug" => "on");

    my $url = $uri->as_string;
    my $wget_cmd = "wget -O - --header=\"Accept: text/html,application/sparql-results+json\"  --http-user=socia --http-passwd=publicconcerns \"$url\"";
    #print "$wget_cmd\n";
    my $response = `$wget_cmd`;
    if ($response) {
	return $response;
    } else {
	return '{"results":{}}';
    }

}

sub get_bindings {
    my $sparql = $_[0];
    my $graph_uri = $_[1];
    my $json = execute_sparql($sparql, $graph_uri);
    #print "[debug] $json\n";
    my $ret = decode_json($json);
    #print "++++", $ret->{"results"}->{"bindings"}, "\n";
    return $ret->{"results"}->{"bindings"};

}
