#!/usr/bin/ruby

# Save a file (specified by parameters fileName and fileContents) and
# produce (as output) the URL to access the file.

require 'cgi'

filePrefix = "/Users/adam/Sites/jsdemo"
 urlPrefix = "http://localhost/~adam/jsdemo"

begin
  cgi = CGI.new
  fileName     = cgi.params['fileName'    ][0]
  fileContents = cgi.params['fileContents'][0]
  fullPath = "#{filePrefix}/#{fileName}"
  File.open(fullPath, "w") { |f| f.write(fileContents) }
  cgi.out { "#{urlPrefix}/#{fileName}" }
end
