Sparqling
=========

Sparqling is an RDF store in your browser.

This is a work in progress. It would be better if we contributed better SPARQL 1.1 compatibility (concretely, support for [SPARQL 1.1 Federated Queries](http://www.w3.org/TR/sparql11-federated-query/) and [SPARQL 1.1 Query Results JSON](http://www.w3.org/TR/sparql11-results-json/)), and an [IndexedDB](http://www.w3.org/TR/IndexedDB/) backend to Antonio Garrote's fantastic [rdfstore-js](https://github.com/antoniogarrote/rdfstore-js).


Web Intents
-----------

Sparqling supports [Web Intents](http://www.w3.org/TR/web-intents/). In lack of common verbs, we claimed an action of `http://mathbiol.org/intents/sparql` and a type of `text/plain` for SPARQL queries.
An example on how to use Web Intents to query the RDF store can be found in `examples/web-intent.html`.


Credits
-------

This code includes a modified version of [rdfstore-js](https://github.com/antoniogarrote/rdfstore-js) written by Antonio Garotte licensed under the [GNU Lesser General Public License Version 3 (LGPLV3)](http://www.gnu.org/licenses/lgpl.html). The changes can be found in a [separate repository](https://github.com/agrueneberg/rdfstore-js).
