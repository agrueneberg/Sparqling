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

    sparql.controller("queryForm", function ($scope, rdfstore) {
        $scope.queryString = "SELECT * WHERE {?s ?p ?o .}";
        $scope.submit = function () {
            try {
                rdfstore.getStore(function (store) {
                    store.execute($scope.queryString, function (success, result) {
                        if (success === true) {
                            console.log(result);
                        } else {
                            console.error(result);
                        }
                    });
                });
            } catch (ex) {
                console.error(ex);
            }
        };
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
                    onChange: function (editor) {
                        scope.value = editor.getValue();
                        scope.$apply();
                    }
                });
            }
        };
    });

}());
