(function () {
    "use strict";

    var sparql;

    sparql = angular.module("sparql", []);

    sparql.factory("rdfstore", function () {
        var store;
        store = null;
        return {
            getStore: function (callback) {
                if (store === null) {
                    rdfstore.create({
                        persistent: true,
                        name: "sparql"
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

    sparql.controller("query", function ($scope, rdfstore) {
        var countTriples;
        countTriples = function () {
            rdfstore.getStore(function (store) {
                store.graph(function (success, graph) {
                    $scope.triples = graph.triples.length;
                });
            });
        };
        $scope.alert = null;
        $scope.queryString = "SELECT * WHERE {?s ?p ?o .}";
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
        $scope.$watch("queryString", function () {
            $scope.sparqlResult = [];
            $scope.sparqlResultVariables = [];
        });
        $scope.dismiss = function () {
            $scope.alert = null;
        };
        $scope.clear = function () {
            rdfstore.getStore(function (store) {
                store.clear();
                countTriples();
            });
        };
        countTriples();
    });

    sparql.directive("codemirror", function () {
        return {
            template: "<textarea></textarea>",
            restrict: "E",
            scope: {
                value: "="
            },
            link: function (scope, element, attrs) {
                var textarea;
                textarea = element.find("textarea").get(0);
                textarea.value = scope.value;
                CodeMirror.fromTextArea(textarea, {
                    mode: "application/x-sparql-query",
                    tabMode: "indent",
                    matchBrackets: true,
                 // Two-finger scrolling in Chrome is prone to go back to the last page.
                    lineWrapping: true,
                    onChange: function (editor) {
                        scope.value = editor.getValue();
                        scope.$apply();
                    }
                });
            }
        };
    });

}());
