(function () {
    'use strict';
    angular
        .module('MealJournalApp', ['ngMaterial', 'ngRoute', 'ngMessages'])
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider
                .when('/journal', {
                    'templateUrl': 'user/journals.html',
                    'controller': 'journalController'
                })
                .when('/journal/:journalId', {
                    'templateUrl': 'user/journal_detail.html',
                    'controller': 'journalDetailController'
                })
                .when('/meals', {
                    'templateUrl': 'user/meals.html',
                    'controller': 'mealsController'
                })
                .when('/meals/:mealId', {
                    'templateUrl': 'user/meal_detail.html',
                    'controller': 'mealDetailController'
                })
                .otherwise({
                    'redirectTo': '/journal'
                });
        }])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider
                .theme('default')
                .primaryPalette('indigo')
                .accentPalette('orange');
        })
        .config(['$mdIconProvider', function ($mdIconProvider) {
            $mdIconProvider
                .iconSet('action', 'svg/action-icons.svg')
                .iconSet('device', 'svg/device-icons.svg')
                .iconSet('navigation', 'svg/navigation-icons.svg')
                .iconSet('content', 'svg/content-icons.svg')
                .iconSet('alert', 'svg/alert-icons.svg')
                .iconSet('image', 'svg/image-icons.svg')
                .defaultIconSet('svg/core-icons.svg');
        }])
        .service('meals', function () {
            return {
                groupMeals: function (mealsArray) {
                        var grabDate = function (timestamp) {
                        var date = new Date(timestamp);
                        var temp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        return temp.getTime().toString();
                    };

                    var meals = {};
                    var date;

                    for (var i = 0; i < mealsArray.length; i += 1) {
                        date = grabDate(mealsArray[i].dateCreated);

                        if (!meals.hasOwnProperty(date)) {
                            meals[date] = [];
                            meals[date].totalCalories = 0;
                        }

                        meals[date].push(mealsArray[i]);  
                        meals[date].totalCalories += mealsArray[i].calories * mealsArray[i].quantity;
                    }

                    return meals;
                }
            };
        })
        .controller('defaultController', ['$scope', '$mdSidenav', '$window', function ($scope, $mdSidenav, $window) {
            $scope.toggleSidenav = function (menuId) {
                $mdSidenav(menuId).toggle();
            };
            $scope.navigateTo = function (where) {
                window.location = window.location.href.split('#')[0] + '#' + where;
            };
            $scope.gotoHome = function () {
                window.location = window.location.origin;
            };
        }])
        .controller('mealsController', ['$scope', '$http', function ($scope, $http) {
            $http
                .get('test/meals.json')
                .success(function (response) {
                    $scope.meals = response.meals;
                });

            $scope.openMeal = function (meal) {
                window.location = window.location.href.split('#')[0] + '#/meals/' + meal.id;
            };

            $scope.searchBoxHidden = true;
            $scope.searchMeals = function () {
                $scope.searchBoxHidden = !$scope.searchBoxHidden;
                /* if (!$scope.searchBoxHidden) {
                    document.getElementById('search-box').focus();
                } */
            };
        }])
        .controller('mealDetailController', ['$scope', '$mdDialog', '$mdToast', function ($scope, $mdDialog, $mdToast) {
            var meal = {
                "name": "Pizza",
                "id": "3",
                "defaultQuantity": "1",
                "unit": "slice",
                "calories": "285",
                "iconUrl": "meals-icons/pizza.jpg",
                "imageUrl": "meals-images/pizza.jpg"
            };

            $scope.currentMeal = meal;

            $scope.unit = meal.unit;
            $scope.calories = meal.calories;
            $scope.quantity = meal.quantity;

            $scope.updateCalories = function () {
                if ($scope.addMealForm.quantity.$valid) {
                    $scope.calories = $scope.quantity * meal.calories;
                }
            };

            $scope.ui = {
                'toolbarLabel': meal.name
            };

            // helper stuffs
            $scope.toastPosition = {
                bottom: true,
                top: false,
                left: false,
                right: true
            };
            $scope.getToastPosition = function () {
                return Object.keys($scope.toastPosition)
                    .filter(function (pos) {
                        return $scope.toastPosition[pos];
                    })
                    .join(' ');
            };

            $scope.backToMeals = function () {
                window.location = window.location.href.split('#')[0] + '#/meals';
            };

            // this functions adds the current meal to the user's journal
            $scope.addJournal = function (ev) {
                if ($scope.addMealForm.$valid) {
                    if ($scope.calories > 2000) {
                        $mdDialog.show(
                            $mdDialog
                                .alert()
                                .parent(angular.element(document.body))
                                .title('Too much calories!')
                                .content('Dude, you must control yourself. Calorie count exceeds 2,000 and you are therefore not allowed to eat this thing. Sorry!')
                                .ariaLabel('Too much calories!')
                                .ok('Got it!')
                                .targetEvent(ev)
                        );
                    } else {
                        // add logic here
                        $mdToast.show(
                            $mdToast
                                .simple()
                                .content('Journal Added!')
                                .hideDelay(1000)
                                .position($scope.getToastPosition())
                        );
                        window.location = window.location.href.split('#')[0] + '#/journal';
                    }
                } else {
                    var confirm = $mdDialog.confirm()
                        .parent(angular.element(document.body))
                        .title('Some data inputted are invalid/missing.')
                        .content('You have to fix the errors before adding this journal.')
                        .ariaLabel('Adding a meal to a journal')
                        .ok('Okay, I\'ll fix it.')
                        .targetEvent(ev);

                    $mdDialog.show(confirm).then(function () {
                        // do nothing
                    });
                }
            };
        }])
        .run(function($rootScope){
		  //Just add a reference to some utility methods in rootscope.
		  $rootScope.Utils = {
		     keys : Object.keys
		  }
		})
        .controller('journalController', ['$scope', '$http', 'meals', function ($scope, $http, meals) {
            // getting journals
            $http
                .get('test/journals.json')
                .success(function (response) {
                	var journals = response.journals;
                    var groupedMeals = meals.groupMeals(journals);
                    
                    $scope.journals = journals;
                    $scope.groupedMeals = groupedMeals;
                    $scope.dates = groupedMeals.keys();
                });

            $scope.openJournal = function (journal) {
                // window.location = window.location.href.split('#')[0] + '#/journal/' + journal.id;
                window.location = window.location.href.split('#')[0] + '#/journal/1';
            };

            $scope.goToMeals = function () {
                window.location = window.location.href.split('#')[0] + '#/meals';
            };

            $scope.searchBoxHidden = true;
            $scope.searchJournal = function () {
                $scope.searchBoxHidden = !$scope.searchBoxHidden;
                /* if (!$scope.searchBoxHidden) {
                    document.getElementById('search-box').focus();
                } */
            };
        }])
        .controller('journalDetailController', ['$scope', '$mdDialog', '$mdToast', function ($scope, $mdDialog, $mdToast) {
            var journal = {
                "name": "Rice",
                "unit": "cup",
                "calories": 205,
                "iconUrl": "meals-icons/rice.jpg",
                "dateCreated": 1436154582626,
                "quantity": 1
            };

            $scope.currentJournal = journal;

            $scope.unit = journal.unit;
            $scope.calories = journal.calories * journal.quantity;
            $scope.quantity = journal.quantity;

            $scope.ui = {
                'toolbarLabel': journal.name
            };

            // helper stuffs
            $scope.toastPosition = {
                bottom: true,
                top: false,
                left: false,
                right: true
            };
            $scope.getToastPosition = function () {
                return Object.keys($scope.toastPosition)
                    .filter(function (pos) {
                        return $scope.toastPosition[pos];
                    })
                    .join(' ');
            };

            $scope.backToJournal = function () {
                window.location = window.location.href.split('#')[0] + '#/journal';
            };

            $scope.updateCalories = function () {
                if ($scope.editJournal.quantity.$valid) {
                    $scope.calories = $scope.quantity * journal.calories;
                }
            };

            $scope.deleteJournal = function (ev) {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog
                                .confirm()
                                .parent(angular.element(document.body))
                                .title('Are you sure you want to delete this journal?')
                                .content('This action cannot be undone.')
                                .ariaLabel('Lucky day')
                                .ok('Delete')
                                .cancel('Cancel')
                                .targetEvent(ev);
                $mdDialog.show(confirm).then(function () {
                    $mdToast.show(
                        $mdToast
                            .simple()
                            .content('Journal Deleted!')
                            .hideDelay(1000)
                            .position($scope.getToastPosition())
                    );
                    window.location = window.location.href.split('#')[0] + '#/journal';
                }, function () {
                    // do nothing
                });
            };

            $scope.updateJournal = function (ev) {
                if ($scope.editJournal.$valid) {
                    if ($scope.calories > 2000) {
                        $mdDialog.show(
                            $mdDialog
                                .alert()
                                .parent(angular.element(document.body))
                                .title('Too much calories!')
                                .content('Dude, you must control yourself. Calorie count exceeds 2,000 and you are therefore not allowed to eat this thing. Sorry!')
                                .ariaLabel('Too much calories!')
                                .ok('Got it!')
                                .targetEvent(ev)
                        );
                    } else {
                        $scope.currentJournal.quantity = $scope.quantity;
                        $mdToast.show(
                            $mdToast
                                .simple()
                                .content('Journal Updated!')
                                .hideDelay(1000)
                                .position($scope.getToastPosition())
                        );
                        window.location = window.location.href.split('#')[0] + '#/journal';
                    }
                } else {
                    var confirm = $mdDialog.confirm()
                        .parent(angular.element(document.body))
                        .title('Some data inputted are invalid/missing.')
                        .content('You have to fix the errors before updating your journal.')
                        .ariaLabel('Updating a meal in a journal')
                        .ok('Okay, I\'ll fix it.')
                        .targetEvent(ev);

                    $mdDialog.show(confirm).then(function () {
                        // do nothing
                    });
                }
            };
        }]);
}());