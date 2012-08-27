(function () {
    "use strict";

    var sparqling;

    sparqling = angular.module("sparqling", []);

    sparqling.factory("rdfstore", function () {
        var store;
        store = null;
        return {
            getStore: function (callback) {
                if (store === null) {
                    rdfstore.create({
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

    sparqling.controller("main", function ($scope, $window) {
        var intent;
        intent = $window.webkitIntent;
        if (intent) {
            $scope.template = "/templates/intent.html";
        } else {
            $scope.template = "/templates/store.html";
        }
    });

    sparqling.controller("rdfstore", function ($scope, rdfstore) {
        var countTriples, emptyResult;
        countTriples = function () {
            rdfstore.getStore(function (store) {
                store.graph(function (success, graph) {
                    $scope.triples = graph.triples.length;
                });
            });
        };
        emptyResult = function () {
            $scope.sparqlResult = [];
            $scope.sparqlResultVariables = [];
        };
        $scope.alert = null;
        $scope.queryString = "SELECT *\nWHERE {\n  \n}";
        $scope.sparqlResult = [];
        $scope.sparqlResultVariables = [];
        $scope.submitQuery = function () {
            try {
                rdfstore.getStore(function (store) {
                    store.execute($scope.queryString, function (success, result) {
                        var variables, normalizedResult;
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
                                    $scope.alert = {
                                        message: "No results.",
                                        type: "info"
                                    };
                                }
                            } else {
                                $scope.alert = {
                                    message: "The operation was successful.",
                                    type: "success"
                                };
                            }
                         // Recount triples.
                            countTriples();
                        } else {
                            $scope.alert = {
                                message: result.message,
                                type: "error"
                            };
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
            rdfstore.getStore(function (store) {
                emptyResult();
                try {
                    store.clear(function (success) {
                        if (success === true) {
                            $scope.alert = {
                                message: "The store was successfully cleared.",
                                type: "success"
                            };
                        } else {
                            $scope.alert = {
                                message: "The store could not be cleared properly.",
                                type: "failure"
                            };
                        }
                        countTriples();
                    });
                } catch (err) {
                    $scope.alert = {
                        message: err.message,
                        type: "failure"
                    };
                    $scope.$apply();
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
                            if (success === true) {
                                emptyResult();
                                countTriples();
                                $scope.alert = {
                                    message: "Successfully imported " + result + " triples.",
                                    type: "success"
                                };
                                $scope.$apply();
                            } else {
                                $scope.alert = {
                                    message: result,
                                    type: "failure"
                                };
                                $scope.$apply();
                            }
                        });
                    });
                };
                reader.readAsText(file);
            }
        };
        countTriples();
    });

    sparqling.controller("intent", function ($scope, $window, rdfstore) {
        var intent, queryString;
        intent = $window.webkitIntent;
        if (typeof intent.data !== "string") {
            intent.postFailure("Invalid Intent type.");
        } else {
            queryString = intent.data;
            rdfstore.getStore(function (store) {
                try {
                    store.execute(queryString, function (success, result) {
                        $scope.debug = success;
                        if (success === true) {
                            intent.postResult(result);
                        } else {
                            intent.postFailure("Unsuccessful query.");
                        }
                    });
                } catch (err) {
                    intent.postFailure(err.message);
                }
            });
        }
    });

    sparqling.directive("codemirror", function () {
        return {
            template: "<textarea></textarea>",
            restrict: "E",
            scope: {
                value: "="
            },
            link: function (scope, element, attrs) {
                var textarea, options, editor;
                textarea = element.find("textarea").get(0);
                textarea.value = scope.value;
                options = {
                    mode: "application/x-sparql-query",
                    tabMode: "indent",
                    matchBrackets: true,
                 // Two-finger scrolling in Chrome is prone to go back to the last page.
                    lineWrapping: true,
                    onChange: function (editor) {
                        scope.value = editor.getValue();
                        scope.$apply();
                    }
                };
                if (attrs.hasOwnProperty("autofocus") === true) {
                    if (attrs.autofocus === "true") {
                        options.autofocus = true;
                    }
                }
                editor = CodeMirror.fromTextArea(textarea, options);
                if (attrs.hasOwnProperty("cursorLine") === true && attrs.hasOwnProperty("cursorCh") === true) {
                    editor.setCursor({
                        line: Number(attrs.cursorLine),
                        ch: Number(attrs.cursorCh)
                    });
                }
            }
        };
    });

 // One ugly hack to support missing input[type='file'] directive.
 // See: http://jsfiddle.net/marcenuc/ADukg/89/
    $("#file-import").live("change", function () {
        angular.element(this).scope().importFile(this);
    });

 // Another ugly hack to make file input fields look pretty in Bootstrap.
    $("#fake-file-import").live("click", function () {
        $("#file-import").click();
    });

}());
