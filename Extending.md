

# Extending

Many aspects of WWW SQL Designer can be customized and enhanced. If you manage to create a new locale / db / backend, feel free to send it to me. I will include your feature in a distribution archive.

## CSS
Visual properties of the application can be tuned by editing files in `css/` subdirectory.

## Locale
Locales can be edited and added in `locale/` subdirectory. New locales must be also registered in `js/config.js`.

## Databases
Supported databases (their datatypes and XSLT template) are stored in `db/` subdirectory. Each database has a datatype definition file (`datatypes.xml`) and a XSL transformation (`output.xsl`). New databases must be also registered in `js/config.js`.

## Backends
Serverside backends allow you to save, load, list and import DB designs. They are written in a serverside scripting language and communicate via HTTP requests. Backends are stored in backend/ subdirectory. A brief summary of backend API follows:

  * ### Saving
> <strong>Request:</strong> POST ?action=save&keyword=somename, XML data contained in POST body <br />
> <strong>Valid responses:</strong> HTTP/201 Created, HTTP/500 Internal Server Error, HTTP/503 Service Unavailable
  * ### Loading
> <strong>Request:</strong> GET ?action=load&keyword=somename <br />
> <strong>Valid responses:</strong> HTTP/200 OK (loaded XML in response body), HTTP/404 Not Found, HTTP/503 Service Unavailable
  * ### Listing
> <strong>Request:</strong> GET ?action=list <br />
> <strong>Valid responses:</strong> HTTP/200 OK (list of available designs separated by newlines in response body), HTTP/503 Service Unavailable
  * ### Importing
> <strong>Request:</strong> GET ?action=import <br />
> <strong>Valid responses:</strong> HTTP/200 OK (imported data in response body), HTTP/503 Service Unavailable

For every action mentioned, the backend may also return HTTP/501 Not Implemented, meaning that this action is not supported by the backend.