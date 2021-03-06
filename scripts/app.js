(function () {
    "use strict";

    /*global $:false, angular:false */

    var sparqling;

    sparqling = angular.module("sparqling", ["ui.codemirror"]);

    sparqling.factory("rdfstore", function ($window) {
        var store;
        store = null;
        return {
            getStore: function (callback) {
                if (store === null) {
                    $window.rdfstore.create({
                        persistent: true,
                        name: "sparqling"
                    }, function (instance) {
                        store = instance;
                        callback(store);
                    });
                } else {
                    callback(store);
                }
            }
        };
    });

    sparqling.controller("main", function ($scope, rdfstore) {
        var countTriples, emptyResult;
        countTriples = function () {
            var graphs;
            graphs = [];
            rdfstore.getStore(function (store) {
             // Iterate over all registered graphs.
                store.registeredGraphs(function (success, registeredGraphs) {
                    var defaultGraphUri;
                 // It looks like `triples.length` returns the number of triples in the default graph + the triples
                 // in the registered graph. Therefore we have to get the number of triples in the default graph first.
                    defaultGraphUri = "https://github.com/antoniogarrote/rdfstore-js#default_graph";
                    store.graph(defaultGraphUri, function (success, defaultGraph) {
                        graphs.push({
                            uri: defaultGraphUri,
                            count: defaultGraph.triples.length
                        });
                        registeredGraphs.forEach(function (registeredGraph) {
                            store.graph(registeredGraph.nominalValue, function (success, graph) {
                                graphs.push({
                                    uri: registeredGraph.nominalValue,
                                    count: graph.triples.length - defaultGraph.triples.length
                                });
                            });
                        });
                    });
                });
            });
            $scope.graphs = graphs;
        };
        emptyResult = function () {
            $scope.sparqlResult = [];
            $scope.sparqlResultVariables = [];
        };
        $scope.alert = null;
        $scope.queryString = "SELECT *\nWHERE {\n  \n}";
        $scope.codeMirrorLoaded = function (editor) {
            var doc;
            editor.focus();
            editor.setOption("mode", "sparql");
            editor.setOption("tabSize", 2);
            doc = editor.getDoc();
         // Set boilerplate query string.
            doc.setValue($scope.queryString);
         // Set position of cursor.
            doc.setCursor(2, 2);
            editor.on("change", function () {
                $scope.queryString = editor.getValue();
            });
        };
        $scope.sparqlResult = [];
        $scope.sparqlResultVariables = [];
        $scope.submitQuery = function () {
            try {
                rdfstore.getStore(function (store) {
                    store.execute($scope.queryString, function (success, result) {
                        var message, variables, normalizedResult;
                        if (success === true) {
                            if (Array.isArray(result) === true) {
                                if (result.length > 0) {
                                 // Extract variable names.
                                    variables = Object.keys(result[0]);
                                 // Normalize result.
                                    normalizedResult = [];
                                    result.forEach(function (binding) {
                                        var normalizedBinding;
                                        normalizedBinding = [];
                                        variables.forEach(function (variable) {
                                            normalizedBinding.push(binding[variable]);
                                        });
                                        normalizedResult.push(normalizedBinding);
                                    });
                                    $scope.sparqlResult = normalizedResult;
                                    $scope.sparqlResultVariables = variables;
                                } else {
                                    message = {
                                        message: "No results.",
                                        type: "info"
                                    };
                                }
                            } else {
                                message = {
                                    message: "The operation was successful.",
                                    type: "success"
                                };
                            }
                         // Recount triples.
                            countTriples();
                        } else {
                            message = {
                                message: result.message,
                                type: "error"
                            };
                        }
                        if (message !== undefined) {
                         // `execute` can be synchronous or asynchronous, i.e. $apply could already be in progress.
                         // See: http://coderwall.com/p/ngisma
                            if ($scope.$$phase === "$apply" || $scope.$$phase === "$digest") {
                                $scope.alert = message;
                            } else {
                                $scope.$apply(function () {
                                    $scope.alert = message;
                                });
                            }
                        }
                    });
                });
            } catch (ex) {
                $scope.alert = {
                    message: ex.message,
                    type: "error"
                };
            }
        };
        $scope.dismiss = function () {
            $scope.alert = null;
        };
        $scope.clear = function () {
            var failure;
            failure = false;
            rdfstore.getStore(function (store) {
                emptyResult();
                try {
                 // Iterate over all registered graphs.
                    store.registeredGraphs(function (success, registeredGraphs) {
                        registeredGraphs = registeredGraphs.map(function (graph) {
                            return graph.nominalValue;
                        });
                     // The default graph does not seem to be a registered graph.
                        registeredGraphs.push("https://github.com/antoniogarrote/rdfstore-js#default_graph");
                        registeredGraphs.forEach(function (registeredGraph) {
                            store.clear(registeredGraph, function (success) {
                                if (success === false) {
                                    failure = true;
                                }
                            });
                        });
                    });
                    if (failure === true) {
                        throw new Error("The store could not be cleared properly.");
                    } else {
                        $scope.alert = {
                            message: "The store was successfully cleared.",
                            type: "success"
                        };
                    }
                } catch (err) {
                    $scope.alert = {
                        message: err.message,
                        type: "error"
                    };
                } finally {
                    countTriples();
                }
            });
        };
        $scope.importFile = function (element) {
            var files, file, reader;
            files = element.files;
            if (files.length === 1) {
                file = files[0];
                reader = new FileReader();
                reader.onload = function (ev) {
                    rdfstore.getStore(function (store) {
                        var type;
                        type = file.type;
                     // If the file type is not provided, make an educated guess.
                     // If nothing matches, leave it up to rdfstore-js.
                        if (type === "") {
                            if (file.name.match(/\.nt$/) !== null) {
                                type = "text/plain";
                            } else if (file.name.match(/\.ttl$/) !== null) {
                                type = "text/turtle";
                            } else if (file.name.match(/\.n3$/) !== null) {
                                type = "text/n3";
                            } else if (file.name.match(/\.jsonld$/) !== null) {
                                type = "application/ld+json";
                            } else if (file.name.match(/\.json$/) !== null) {
                                type = "application/json";
                            } else if (file.name.match(/\.rdf$/) !== null) {
                                type = "application/rdf+xml";
                            } else if (file.name.match(/\.xml$/) !== null) {
                                type = "text/xml";
                            }
                        }
                        store.load(type, ev.target.result, function (success, result) {
                            var message;
                            if (success === true) {
                                emptyResult();
                                countTriples();
                                message = {
                                    message: "Successfully imported " + result + " triples.",
                                    type: "success"
                                };
                            } else {
                                message = {
                                    message: result,
                                    type: "error"
                                };
                            }
                            $scope.$apply(function () {
                                $scope.alert = message;
                            });
                        });
                    });
                };
                reader.readAsText(file);
            }
        };
        countTriples();
    });

 // One ugly hack to support missing input[type='file'] directive.
 // See: http://jsfiddle.net/marcenuc/ADukg/89/
    $(document).on("change", "#file-import", function () {
        angular.element(this).scope().importFile(this);
    });

 // Another ugly hack to make file input fields look pretty in Bootstrap.
    $(document).on("click", "#fake-file-import", function () {
        $("#file-import").click();
    });

}());