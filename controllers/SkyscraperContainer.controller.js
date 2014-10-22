(function () {
    'use strict';

    angular
        .module('pg.skyscrapers')
        .controller('SkyscraperContainerCtrl', SkyscraperContainerCtrl);

    SkyscraperContainerCtrl.$inject = ['SkyscrapersUtils'];

    function SkyscraperContainerCtrl(SkyscrapersUtils) {
        var self = this;
        var gridItems = [];
        var loadingQueue = [];
        var visibleClass = 'visible';

        //container
        var $container;
        var containerHeight;
        var containerWidth;

        //column
        var $sizer;
        var columns = {};
        var fixedColumnWidth;
        var columnWidth;
        var columnsCount;

        this.setContainer = function ($element) {
            $container = $element;
            containerHeight = $container.height();
        };

        this.setSizer = function ($element) {
            $sizer = $element;
            this.layout();
        };

        this.setVisibleClass = function (className) {
            visibleClass = className;
        };

        this.layout = function (customColumnWidth) {
            fixedColumnWidth = customColumnWidth;
            containerWidth = $container.width();
            
            this._resetColumnsObject();
            this._calculateAllItemsPositions();
        };

        this.addItem = function ($item) {
            $item.loaded = false;
            loadingQueue.push($item);

            SkyscrapersUtils.imagesLoaded($item[0], function () {
                $item.loaded = true;
                self._checkQueue();
            });
        };
        
        this.removeItem = function ($item) {
            var itemIndex = gridItems.indexOf($item);

            gridItems.splice(itemIndex, 1);
            this._calculateAllItemsPositions(itemIndex - 1);
        };

        this._resetColumnsObject = function () {
            var calculatedColumnsCount = this._calculateColumnsCount(fixedColumnWidth || $sizer.outerWidth());
            //reset columns heights
            columns = {};
            while (calculatedColumnsCount--) {
                columns[calculatedColumnsCount] = 0;
            }
        };

        this._calculateColumnsCount = function (oneColumnWidth) {
            //fix browsers rounding
            var n = Math.floor(containerWidth / oneColumnWidth);
            var n1 = Math.floor(containerWidth / (oneColumnWidth - 1));

            columnWidth = n1 > n ? oneColumnWidth - 1 : oneColumnWidth;
            
            columnsCount = Math.floor(containerWidth / columnWidth);

            return columnsCount;
        };

        this._calculateItemPosition = function ($item) {
            var minIndex = this._getColumnsInfo().min.index;

            $item
                .css({
                    position: 'absolute',
                    left: columnWidth * minIndex,
                    top: columns[minIndex]
                })
                .addClass(visibleClass);

            $item.columnIndex = minIndex;
            columns[minIndex] += $item.outerHeight();

            this._calculateContainerHeight();
        };

        this._calculateAllItemsPositions = function (prevElementIndex) {
            var i = 0;
            var length = gridItems.length;
            var columnIndex = prevElementIndex;
            var columnsHeight = {};

            if (prevElementIndex && prevElementIndex > columnsCount) {
                while (prevElementIndex > 0 && Object.keys(columnsHeight).length !== columnsCount) {
                    i = prevElementIndex;

                    if (!columnsHeight[gridItems[prevElementIndex].columnIndex]) {
                        columnsHeight[gridItems[prevElementIndex].columnIndex] =
                            parseInt(gridItems[prevElementIndex].css('top'), 10);
                    }

                    prevElementIndex--;
                }

                for (columnIndex in columnsHeight) {
                    if (columnsHeight.hasOwnProperty(columnIndex)) {
                        columns[columnIndex] = columnsHeight[columnIndex];
                    }
                }
            }

            for (;i < length; i++) {
                self._calculateItemPosition(gridItems[i]);
            }

            this._calculateContainerHeight(true);
        };

        this._calculateContainerHeight = function(force) {
            var columnsInfo = this._getColumnsInfo();
            var maxHeight = columns[columnsInfo.max.index];

            if (containerHeight < maxHeight || force) {
                containerHeight = maxHeight;
                $container.height(maxHeight);
            }
        };

        this._checkQueue = function () {
            while (loadingQueue.length > 0 && loadingQueue[0].loaded) {
                var $item = loadingQueue.shift();

                gridItems.push($item);
                this._calculateItemPosition($item);
            }
        };

        this._getColumnsInfo = function () {
            var minColumnIndex = 0;
            var maxColumnIndex = 0;
            var min = Infinity;
            var max = 0;
            var index;

            for (index in columns) {
                if (columns.hasOwnProperty(index)) {
                    if (columns[index] < min) {
                        min = columns[index];
                        minColumnIndex = index;
                    }

                    if (columns[index] > max) {
                        max = columns[index];
                        maxColumnIndex = index;
                    }
                }
            }

            return {
                min: {
                    index: minColumnIndex,
                    value: min
                },
                max: {
                    index: maxColumnIndex,
                    value: max
                }
            };
        };

    }
})();