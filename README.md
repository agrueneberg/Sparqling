Sparqling
=========

Sparqling is an RDF store in your browser.

This is a work in progress. It would be better if we contributed better SPARQL 1.1 compatibility (concretely, support for [SPARQL 1.1 Federated Queries](http://www.w3.org/TR/sparql11-federated-query/) and [SPARQL 1.1 Query Results JSON](http://www.w3.org/TR/sparql11-results-json/)), and an [IndexedDB](http://www.w3.org/TR/IndexedDB/) backend to Antonio Garrote's fantastic [rdfstore-js](https://github.com/antoniogarrote/rdfstore-js).


Import
------

Sparqling can import small data sets directly from your hard drive. The most common RDF serialization formats are supported: N-Triples, Turtle, RDF/XML (thanks to @jmandel), and N3.

`rdfstore-js` currently relies on `localStorage` to persist data in the browser. The maximum amount of data that Chrome allows you to store is 5 MB. There is some overhead for indexing data, so please do not try to import files larger than 2.5 MB.


Credits
-------

This code includes a modified version of [rdfstore-js](https://github.com/antoniogarrote/rdfstore-js) written by Antonio Garotte licensed under the [GNU Lesser General Public License Version 3 (LGPLV3)](http://www.gnu.org/licenses/lgpl.html). The changes can be found in a [separate repository](https://github.com/agrueneberg/rdfstore-js).
