/*
    File: script.js
    GUI Assignment: HW5 Implementing a Bit of Scrabble with Drag-and-Drop   
    Nikolas Haddock, UMass Lowell Computer Science, 
    nikolas_haddock@student.uml.edu 
    Copyright (c) 2024 by Nikolas Haddock.  All rights reserved.
    This JavaScript file implements a simplified Scrabble game with drag-and-drop 
    functionality using jQuery and jQuery UI. It dynamically populates a tile rack 
    with random Scrabble tiles, tracks their positions on the board, and updates the 
    current word and score in real time. It supports special tiles such as blank tiles 
    that can be assigned a letter through a dialog box. The file handles scoring with 
    letter and word multipliers, validates words for consecutive letters, and updates 
    the rack with new tiles after word submission. The game also includes functionality 
    to recall tiles to the rack, reset the game, and display error messages for invalid words. 
*/

// This is from the provided file created by Jesse M. Heines
var ScrabbleTiles = [];
ScrabbleTiles["A"] = { "value": 1, "original-distribution": 9, "number-remaining": 9 };
ScrabbleTiles["B"] = { "value": 3, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["C"] = { "value": 3, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["D"] = { "value": 2, "original-distribution": 4, "number-remaining": 4 };
ScrabbleTiles["E"] = { "value": 1, "original-distribution": 12, "number-remaining": 12 };
ScrabbleTiles["F"] = { "value": 4, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["G"] = { "value": 2, "original-distribution": 3, "number-remaining": 3 };
ScrabbleTiles["H"] = { "value": 4, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["I"] = { "value": 1, "original-distribution": 9, "number-remaining": 9 };
ScrabbleTiles["J"] = { "value": 8, "original-distribution": 1, "number-remaining": 1 };
ScrabbleTiles["K"] = { "value": 5, "original-distribution": 1, "number-remaining": 1 };
ScrabbleTiles["L"] = { "value": 1, "original-distribution": 4, "number-remaining": 4 };
ScrabbleTiles["M"] = { "value": 3, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["N"] = { "value": 1, "original-distribution": 6, "number-remaining": 6 };
ScrabbleTiles["O"] = { "value": 1, "original-distribution": 8, "number-remaining": 8 };
ScrabbleTiles["P"] = { "value": 3, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["Q"] = { "value": 10, "original-distribution": 1, "number-remaining": 1 };
ScrabbleTiles["R"] = { "value": 1, "original-distribution": 6, "number-remaining": 6 };
ScrabbleTiles["S"] = { "value": 1, "original-distribution": 4, "number-remaining": 4 };
ScrabbleTiles["T"] = { "value": 1, "original-distribution": 6, "number-remaining": 6 };
ScrabbleTiles["U"] = { "value": 1, "original-distribution": 4, "number-remaining": 4 };
ScrabbleTiles["V"] = { "value": 4, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["W"] = { "value": 4, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["X"] = { "value": 8, "original-distribution": 1, "number-remaining": 1 };
ScrabbleTiles["Y"] = { "value": 4, "original-distribution": 2, "number-remaining": 2 };
ScrabbleTiles["Z"] = { "value": 10, "original-distribution": 1, "number-remaining": 1 };
ScrabbleTiles["_"] = { "value": 0, "original-distribution": 2, "number-remaining": 2 };

$(document).ready(function () {
    // Start the game
    initGame();

    // Randomly populates the rack with tiles by checking how many tiles are needed (defualt is 7)
    // and then appending the random tile to the rack
    function populateRack(extraTilesNeeded = 7) {
        const rack = $("#holder");
        let availableTiles = Object.keys(ScrabbleTiles);
        for (let i = 0; i < extraTilesNeeded; i++) {
            let tile = getRandomTile(availableTiles);
            let tileName = tile === "_" ? "Blank" : tile;
            let img = $(`<img src='graphics_data/Scrabble_Tiles/Scrabble_Tile_${tileName}.jpg' 
                            alt='${tile}' class='draggable ui-widget-content'>`);
            rack.append(img);
        }
        makeDraggable();
        updateLettersRemaining();
    }

    // Gets a random tile by geting a random number within the current length
    // of the tiles and updates the count. If the chosen tile has no more left
    // recursively try again.
    function getRandomTile(tiles) {
        let index = Math.floor(Math.random() * tiles.length);
        let tile = tiles[index];
        if (ScrabbleTiles[tile]["number-remaining"] > 0) {
            ScrabbleTiles[tile]["number-remaining"]--;
            return tile;
        } else {
            return getRandomTile(tiles);
        }
    }

    // Resets ScrabbleTiles data structure
    function resetTileData() {
        for (let tile in ScrabbleTiles) { // like a c++ foreach
            ScrabbleTiles[tile]["number-remaining"] = ScrabbleTiles[tile]["original-distribution"];
        }
    }

    // Make tiles draggable
    function makeDraggable() {
        $(".draggable").draggable({
            revert: function (droppable) { // makes the tile snap back if it isn't dropped on a droppable spot
                if (!droppable) {
                    // If dropped in an invalid area, restore the tile's data to its spot
                    // this makes sure the word updates
                    let parent = $(this).data("original-parent");
                    if (parent && parent.hasClass("droppable")) {
                        if ($(this).attr("alt") === "_") // makes sure the blank tile is handled properly
                            $(this).attr("src", "graphics_data/Scrabble_Tiles/Scrabble_Tile_Blank.jpg");
                        parent.data("tile", $(this).attr("alt"));
                    }
                    updateWordFromBoard();
                    calculateScore();
                }
                return !droppable;
            },
            start: function () {
                let parent = $(this).parent();
                if (parent.hasClass("droppable")) {
                    $(this).data("original-parent", parent); // Save the original parent
                    parent.removeData("tile"); // Clear the tile data from the current space
                    updateWordFromBoard();
                    calculateScore();
                }
            },
        });
    }


    function makeDroppable() {
        // Make board spaces droppable
        $(".droppable").droppable({
            accept: ".draggable",
            drop: function (event, ui) {
                let draggedTile = ui.draggable;
                let targetTile = $(this).children(".draggable");

                if (targetTile.length > 0) { // checks if space is occupied
                    let draggedParent = draggedTile.parent();

                    // moves tile to dragged tile's original space
                    targetTile.detach().appendTo(draggedParent);
                    draggedParent.data("tile", targetTile.attr("alt"));
                }

                // appends new tile to the space
                $(this).append(draggedTile);
                draggedTile.css({ top: "", left: "" });
                $(this).data("tile", draggedTile.attr("alt")); // Store the tile information

                if (draggedTile.attr("alt") === "_") {
                    openBlankTileDialog(draggedTile, $(this));
                }

                updateWordFromBoard();
                calculateScore();
            },
        });

        // Make rack droppable to return tiles
        $("#holder").droppable({
            accept: ".draggable",
            // on drop, append the tile, remove data from the board
            // reset blank tile if needed, update scores
            drop: function (event, ui) {
                $(this).append(ui.draggable);
                ui.draggable.css({ top: "", left: "" });
                let parent = ui.draggable.parent();
                if (parent.hasClass("droppable")) {
                    parent.removeData("tile"); // Clear data from board
                    if (ui.draggable.attr("alt") === "_") {
                        ui.draggable.attr("src", "graphics_data/Scrabble_Tiles/Scrabble_Tile_Blank.jpg");
                    }
                    updateWordFromBoard();
                    calculateScore();
                }
            },
        });
    }

    // Open a dialog to choose a letter for a blank tile
    function openBlankTileDialog(tile, droppableSpace) {
        let dialogContent = $("<div class='dialog'>");
        let buttonSet = $('<div>');

        // Create buttons for each letter A-Z
        for (let i = 65; i <= 90; i++) { // iterates over ascii codes A-Z
            let letter = String.fromCharCode(i);
            let button = $(`<button class="blankButtons"><img src='graphics_data/Scrabble_Tiles/Scrabble_Tile_${letter}.jpg' height='50px' width='50px'></button>`).on("click", function () {
                tile.attr("src", `graphics_data/Scrabble_Tiles/Scrabble_Tile_${letter}.jpg`);
                droppableSpace.data("tile", letter);
                updateWordFromBoard();
                calculateScore();
                dialogContent.dialog("close");
            });
            buttonSet.append(button);
        }

        dialogContent.append(buttonSet);

        dialogContent.dialog({
            title: "Blank Tile",
            modal: true, // disables rest of page
            close: function () {
                dialogContent.remove();
            }
        });
    }

    // Update the word based on the current state of the board
    function updateWordFromBoard() {
        let word = "";

        // checks if there is a tile on each space
        $("#board .droppable").each(function () {
            let tile = $(this).data("tile");
            if (tile) {
                word += tile;
            }
        });

        $("#word").text(word.trim()); // updates the word shown on screen
    }

    // Calculate score
    function calculateScore() {
        let currentScore = 0;
        let totalScore = parseInt($("#score").data("total-score")) || 0; // returns zero if #score is null
        let wordMultiplier = 1;
        let isValid = true;

        // Collect all tiles on the board, preserving their positions
        let boardTiles = Array(15).fill("_"); // Assuming 15 spaces on the board
        $("#board .droppable").each(function (index) {
            // sets multipliers based on tile positions
            let tile = $(this).data("tile");
            if (tile) {
                let letterMultiplier = 1;
                if ($(this).hasClass("doubleLetter")) letterMultiplier = 2;
                if ($(this).hasClass("doubleWord")) wordMultiplier *= 2;

                let tileValue = ScrabbleTiles[tile].value * letterMultiplier;
                currentScore += tileValue;
                boardTiles[index] = tile;
            }
        });

        // Check if the word is valid
        let trimmedWord = boardTiles.join("").replace(/^_+|_+$/g, ""); // removes leading and trailing '_', but keeps the ones within the string
        isValid = !trimmedWord.includes("_"); // word is invalid if it contains '_'

        // If invalid, set the current score to 0
        if (!isValid) {
            currentScore = 0;
        }

        currentScore *= wordMultiplier; // Apply word multiplier to the total score

        // Update the word display with score
        $("#word").text(trimmedWord + (trimmedWord && isValid ? ` (${currentScore})` : "")); // displays score only if word is valid
        $("#score").text(totalScore).data("current-score", currentScore);
    }

    function updateTotalScore() {
        let currentScore = parseInt($("#score").data("current-score")) || 0;
        let totalScore = parseInt($("#score").data("total-score")) || 0;
        totalScore += currentScore;
        $("#score").text(totalScore).data("total-score", totalScore);
    }

    // Update letters remaining
    function updateLettersRemaining() {
        let count = 0;
        for (let tile in ScrabbleTiles) {
            count += ScrabbleTiles[tile]["number-remaining"];
        }
        $("#count").text(count);
    }

    // Initialize the game
    function initGame() {
        resetTileData();
        $("#holder").empty();
        $("#board .droppable").empty().removeData("tile");
        populateRack();
        makeDroppable();
        $("#word").text("");
        $("#score").text(0).data("total-score", 0).data("current-score", 0);  // sets the 'total-score' and current-scpore attributes
        updateLettersRemaining();
    }

    // submits the word after checking its validity, updates score board, resets board, and refills rack
    $("#submitWord").on("click", function () {
        let word = $("#word").text();
        // shows error if the word is null, contains '_' or is less than 2 letters
        if (!word || word.includes("_") || word.replace(/[^A-Za-z]/g, '').length < 2) {
            $("#error-message").text("Tiles must form a valid consecutive word of at least 2 letters.").show();
            return;
        }

        $("#error-message").text("").hide();
        updateTotalScore();
        updateWordFromBoard();

        let usedTiles = 0;

        // Clear the board and count used tiles
        $("#board .droppable").each(function () {
            if ($(this).children().length > 0) {
                $(this).empty().removeData("tile");
            }
        });

        // Add only the number of tiles needed to reach 7
        let currentTiles = $("#holder .draggable").length;
        let tilesNeeded = 7 - currentTiles;
        populateRack(tilesNeeded);

        $("#word").text("");
        $("#score").data("current-score", 0);
        updateLettersRemaining();
    });

    // 
    $("#recall").on("click", function () {
        $("#board .droppable .draggable").each(function () {
            let tile = $(this);
            // resets blank tile to blank tile
            if (tile.attr("alt") === "_" && tile.attr("src") !== "graphics_data/Scrabble_Tiles/Scrabble_Tile_Blank.jpg") {
                tile.attr("src", "graphics_data/Scrabble_Tiles/Scrabble_Tile_Blank.jpg");
            }
            tile.appendTo("#holder");
        });
        // resets data points
        $("#board .droppable").removeData("tile");
        updateWordFromBoard();
        calculateScore();
        $("#error-message").text("").hide();
    });

    $("#newGame").on("click", function () {
        initGame();
        $("#error-message").text("").hide();
    });

});
