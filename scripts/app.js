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

    sparqling.controller("query", function ($scope, rdfstore) {
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
                store.clear();
                countTriples();
            });
        };
        countTriples();
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

}());
