#!d:\perl\bin\perl.exe -wT
# C.SUDRE - cyril.sudre@edf.fr

use strict;
use File::Basename;
use IO::File;
use CGI;

# Directory for datafile. Take care to untaint current execution dir for CGI while -T if you
# choose to keep datafile in the same dir than cgi script.
my $base_dir = (dirname($0) =~ /(.*)/)[0] . "/data/";

my $query = new CGI;
my $action = $query->url_param('action') || '';

# List available files to load
if($action eq "list") {  
        print $query->header('text/plain');
        my @files = glob($base_dir . "*");
        for (@files) {
				print(basename($_) . "\n");
            }
}

# Save generated XML to file
elsif($action eq "save") { 
        # Accept names with spaces and/or extention
        my $fname_parameter = ($query->url_param('keyword') =~ /([\w\s]+(\.\w+)*)/)[0]; # Untaint
        if (! defined $fname_parameter) { die "Invalid filename!"; }
        my $filename = $base_dir . $fname_parameter;

        my $fh = new IO::File ">" . $filename;
        if (defined $fh) {
            # Win32...
            binmode $fh;
            
            #my $xml = $query->query_string();
            my $xml = $query->param('POSTDATA');
            
            # Decode
            $xml =~ tr/+/ /;
            $xml =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;

            print $fh $xml;

            $fh->close;
        }
        
        print $query->header(-status => "201 File created");
    }

# Load XML from file
elsif($action eq "load") {
        # Accept names with spaces and/or extention
        my $fname_parameter = ($query->url_param('keyword') =~ /([\w\s]+(\.\w+)*)/)[0]; # Untaint
        my $filename = $base_dir . $fname_parameter;
    
        undef $/; # Slurp
        my $fh = new IO::File "< " . $filename;
        
        if (defined $fh) {
            # Need this for UTF-8 AND Win32...
            binmode($fh,":utf8");

            my $content = <$fh>;
            $fh->close;
            
            print $query->header("text/xml"), $content;
        } else { print $query->header(-status => "404 Not Found"); }
    }

else { 
    print $query->header(-status => "501 Not Implemented");
    }
    