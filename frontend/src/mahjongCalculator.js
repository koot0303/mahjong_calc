// frontend/src/mahjongCalculator.js

// Helper function to count tile occurrences (string representation)
const countTiles = (hand) => {
  const tileCounts = {};
  hand.forEach(tile => {
    tileCounts[tile] = (tileCounts[tile] || 0) + 1;
  });
  return tileCounts;
};

// Helper function to convert tile strings to objects
const convertTilesToObjects = (hand) => {
  return hand.map(tileString => {
    let suit;
    let value;

    if (['ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun'].includes(tileString)) {
      suit = 'jihai';
      value = tileString; // Keep the string value for jihai
    } else if (['aka1-66-90-l', 'aka2-66-90-l', 'aka3-66-90-l'].includes(tileString)) {
      // Handle red dora conversion
      if (tileString === 'aka1-66-90-l') { return { suit: 'manzu', value: 5, isRedDora: true }; }
      if (tileString === 'aka2-66-90-l') { return { suit: 'pinzu', value: 5, isRedDora: true }; }
      if (tileString === 'aka3-66-90-l') { return { suit: 'souzu', value: 5, isRedDora: true }; }
    } else {
      const suitChar = tileString.slice(-1);
      const val = tileString.slice(0, -1);

      if (suitChar === 'm') suit = 'manzu';
      else if (suitChar === 'p') suit = 'pinzu';
      else if (suitChar === 's') suit = 'souzu';
      value = parseInt(val);
    }
    return { suit: suit, value: value };
  });
};

// Helper function to sort tiles (object representation)
const sortTiles = (tiles) => {
  const suitOrder = {
    'manzu': 1,
    'pinzu': 2,
    'souzu': 3,
    'jihai': 4
  };

  const jihaiOrder = {
    'ton': 1,
    'nan': 2,
    'shaa': 3,
    'pei': 4,
    'haku': 5,
    'hatsu': 6,
    'chun': 7
  };

  return tiles.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    if (a.suit === 'jihai') {
      return jihaiOrder[a.value] - jihaiOrder[b.value];
    } else {
      return a.value - b.value;
    }
  });
};

// Recursive function to find 4 melds from remaining tiles
// This function will now return an array of ALL possible sets of 4 melds if successful, or an empty array otherwise.
const findMeldsRecursive = (currentTileCounts, meldsFound, currentMelds) => {
  // Base case: If 4 melds are found, return the current set of melds
  if (meldsFound === 4) {
    return [currentMelds]; // Return as an array containing one valid combination
  }

  // Find the first tile with count > 0
  let firstTileString = null;
  const allPossibleTiles = [
    '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
    '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
    '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
    'ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun'
  ];

  for (const tileString of allPossibleTiles) {
    if (currentTileCounts[tileString] && currentTileCounts[tileString] > 0) {
      firstTileString = tileString;
      break;
    }
  }

  if (!firstTileString) {
    // If no tiles left but not 4 melds, it's not a valid path
    return []; // No valid combinations from this path
  }

  const tileObject = convertTilesToObjects([firstTileString])[0];
  let allFoundMelds = [];

  // Option 1: Try to form a triplet (kotsu)
  if (currentTileCounts[firstTileString] >= 3) {
    const newCounts = { ...currentTileCounts };
    newCounts[firstTileString] -= 3;
    const results = findMeldsRecursive(newCounts, meldsFound + 1, [...currentMelds, { type: 'kotsu', tiles: [firstTileString, firstTileString, firstTileString] }]);
    allFoundMelds = allFoundMelds.concat(results);
  }

  // Option 2: Try to form a sequence (shuntsu)
  // Only for number tiles (manzu, pinzu, souzu)
  if (['manzu', 'pinzu', 'souzu'].includes(tileObject.suit) && tileObject.value <= 7) {
    const nextTileString = `${tileObject.value + 1}${tileObject.suit.charAt(0)}`;
    const nextNextTileString = `${tileObject.value + 2}${tileObject.suit.charAt(0)}`;

    if (currentTileCounts[firstTileString] >= 1 &&
        currentTileCounts[nextTileString] >= 1 &&
        currentTileCounts[nextNextTileString] >= 1) {

      const newCounts = { ...currentTileCounts };
      newCounts[firstTileString] -= 1;
      newCounts[nextTileString] -= 1;
      newCounts[nextNextTileString] -= 1;

      const results = findMeldsRecursive(newCounts, meldsFound + 1, [...currentMelds, { type: 'shuntsu', tiles: [firstTileString, nextTileString, nextNextTileString] }]);
      allFoundMelds = allFoundMelds.concat(results);
    }
  }

  return allFoundMelds;
};

// New function to decompose a 13-tile hand and find possible completions
const decomposeHand = (thirteenTileHand, winningTile) => {
  const possibleCompletions = [];
  const baseTileCounts = countTiles(thirteenTileHand);

  // Try to form a pair with the winning tile
  if (baseTileCounts[winningTile] === 1) { // If winningTile forms a pair with an existing tile
    const tempCounts = { ...baseTileCounts };
    tempCounts[winningTile]--; // Remove one instance of winningTile
    // Now, try to form 4 melds from the remaining 12 tiles
    const foundMeldsCombinations = findMeldsRecursive(tempCounts, 0, []);
    if (foundMeldsCombinations.length > 0) {
      foundMeldsCombinations.forEach(melds => {
        possibleCompletions.push({
          pair: winningTile,
          melds: melds,
          winningTileRole: 'pair',
          waitShape: 'tanki' // Tanki wait
        });
      });
    }
  }

  // Try to form a kotsu with the winning tile
  if (baseTileCounts[winningTile] === 2) { // If winningTile forms a kotsu with two existing tiles
    const tempCounts = { ...baseTileCounts };
    tempCounts[winningTile] -= 2; // Remove two instances of winningTile
    // Now, try to form 4 melds from the remaining 12 tiles
    const foundMeldsCombinations = findMeldsRecursive(tempCounts, 0, []);
    if (foundMeldsCombinations.length > 0) {
      foundMeldsCombinations.forEach(melds => {
        possibleCompletions.push({
          pair: null, // Pair is somewhere else
          melds: [...melds, { type: 'kotsu', tiles: [winningTile, winningTile, winningTile] }],
          winningTileRole: 'kotsu',
          waitShape: 'shanpon' // Shanpon wait
        });
      });
    }
  }

  // Try to form a shuntsu with the winning tile
  const winningTileObject = convertTilesToObjects([winningTile])[0];
  if (winningTileObject.suit !== 'jihai') {
    // Case 1: WinningTile completes X, Y, WinningTile (e.g., 1,2,3 where 3 is winning)
    if (winningTileObject.value >= 3) {
      const t1 = `${winningTileObject.value - 2}${winningTileObject.suit.charAt(0)}`;
      const t2 = `${winningTileObject.value - 1}${winningTileObject.suit.charAt(0)}`;
      if (baseTileCounts[t1] > 0 && baseTileCounts[t2] > 0) {
        const tempCounts = { ...baseTileCounts };
        tempCounts[t1]--;
        tempCounts[t2]--;
        const foundMeldsCombinations = findMeldsRecursive(tempCounts, 0, []);
        if (foundMeldsCombinations.length > 0) {
          foundMeldsCombinations.forEach(melds => {
            let waitShape = 'ryanmen'; // Default to ryanmen
            if (winningTileObject.value === 3 && convertTilesToObjects([t1])[0].value === 1) {
              waitShape = 'penchan';
            }
            possibleCompletions.push({
              pair: null,
              melds: [...melds, { type: 'shuntsu', tiles: [t1, t2, winningTile] }],
              winningTileRole: 'shuntsu',
              waitShape: waitShape
            });
          });
        }
      }
    }
    // Case 2: WinningTile completes WinningTile, X, Y (e.g., 7,8,9 where 7 is winning)
    if (winningTileObject.value <= 7) {
      const t2 = `${winningTileObject.value + 1}${winningTileObject.suit.charAt(0)}`;
      const t3 = `${winningTileObject.value + 2}${winningTileObject.suit.charAt(0)}`;
      if (baseTileCounts[t2] > 0 && baseTileCounts[t3] > 0) {
        const tempCounts = { ...baseTileCounts };
        tempCounts[t2]--;
        tempCounts[t3]--;
        const foundMeldsCombinations = findMeldsRecursive(tempCounts, 0, []);
        if (foundMeldsCombinations.length > 0) {
          foundMeldsCombinations.forEach(melds => {
            let waitShape = 'ryanmen'; // Default to ryanmen
            if (winningTileObject.value === 7 && convertTilesToObjects([t3])[0].value === 9) {
              waitShape = 'penchan';
            }
            possibleCompletions.push({
              pair: null,
              melds: [...melds, { type: 'shuntsu', tiles: [winningTile, t2, t3] }],
              winningTileRole: 'shuntsu',
              waitShape: waitShape
            });
          });
        }
      }
    }
    // Case 3: WinningTile completes X, WinningTile, Y (e.g., 2_4 -> 3)
    if (winningTileObject.value >= 2 && winningTileObject.value <= 8) {
      const t1 = `${winningTileObject.value - 1}${winningTileObject.suit.charAt(0)}`;
      const t3 = `${winningTileObject.value + 1}${winningTileObject.suit.charAt(0)}`;
      if (baseTileCounts[t1] > 0 && baseTileCounts[t3] > 0) {
        const tempCounts = { ...baseTileCounts };
        tempCounts[t1]--;
        tempCounts[t3]--;
        const foundMeldsCombinations = findMeldsRecursive(tempCounts, 0, []);
        if (foundMeldsCombinations.length > 0) {
          foundMeldsCombinations.forEach(melds => {
            possibleCompletions.push({
              pair: null,
              melds: [...melds, { type: 'shuntsu', tiles: [t1, winningTile, t3] }],
              winningTileRole: 'shuntsu',
              waitShape: 'kanchan'
            });
          });
        }
      }
    }
  }

  return possibleCompletions;
};

// Function to check for Chiitoitsu (Seven Pairs)
const isChiitoitsu = (hand) => {
  if (hand.length !== 14) {
    return false;
  }
  const tileCounts = countTiles(hand);
  let pairs = 0;
  for (const tileString in tileCounts) {
    if (tileCounts[tileString] === 2) {
      pairs++;
    } else if (tileCounts[tileString] !== 0) { // If any tile count is not 2 or 0, it's not Chiitoitsu
      return false;
    }
  }
  return pairs === 7;
};

// Function to check for Kokushi Musou (Thirteen Orphans)
const isKokushiMusou = (hand) => {
  // Kokushi Musou can be 13 tiles (13-sided wait) or 14 tiles (after drawing the winning tile)
  if (hand.length !== 13 && hand.length !== 14) {
    return false;
  }

  const yaochuuhai = [
    '1m', '9m', '1p', '9p', '1s', '9s',
    'ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun'
  ];

  const tileCounts = countTiles(hand);

  let pairFound = false;
  let uniqueYaochuuhaiCount = 0;

  for (const tile of yaochuuhai) {
    if (tileCounts[tile]) {
      uniqueYaochuuhaiCount++;
      if (tileCounts[tile] === 2) {
        if (pairFound) { // More than one pair
          return false;
        }
        pairFound = true;
      } else if (tileCounts[tile] > 2) { // More than 2 of any yaochuuhai
        return false;
      }
    } else { // Missing a yaochuuhai
      return false;
    }
  }

  // For a 14-tile hand, there must be exactly one pair
  if (hand.length === 14 && !pairFound) {
    return false;
  }

  // For a 13-tile hand (13-sided wait), there should be no pair yet
  if (hand.length === 13 && pairFound) {
    return false;
  }

  return uniqueYaochuuhaiCount === 13;
};

// Function to check for Yakuhai (Dragon triplets, Wind triplets)
const isYakuhai = (tileCounts, baKaze, jiKaze) => {
  const yakus = [];

  // Dragon triplets
  if (tileCounts['haku'] >= 3) yakus.push({ name: '白', han: 1 });
  if (tileCounts['hatsu'] >= 3) yakus.push({ name: '發', han: 1 });
  if (tileCounts['chun'] >= 3) yakus.push({ name: '中', han: 1 });

  // Wind triplets
  if (tileCounts[baKaze] >= 3) yakus.push({ name: `場風 ${baKaze === 'ton' ? '東' : baKaze === 'nan' ? '南' : baKaze === 'shaa' ? '西' : '北'}`, han: 1 });
  if (tileCounts[jiKaze] >= 3) yakus.push({ name: `自風 ${jiKaze === 'ton' ? '東' : jiKaze === 'nan' ? '南' : jiKaze === 'shaa' ? '西' : '北'}`, han: 1 });

  return yakus;
};

// Function to check for Tanyao (All Simples)
const isTanyao = (hand) => {
  const yaochuuhai = [
    '1m', '9m', '1p', '9p', '1s', '9s',
    'ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun'
  ];

  for (const tile of hand) {
    if (yaochuuhai.includes(tile)) {
      return false;
    }
  }
  return true;
};

// Function to check for Pinfu (平和)
const isPinfu = (decomposition, winningTile, options) => {
  if (!decomposition) return false;

  const { pair, melds, waitShape } = decomposition;

  // Pinfu requires 4 shuntsu (sequences)
  const allShuntsu = melds.every(meld => meld.type === 'shuntsu');
  if (!allShuntsu) return false;

  // Pinfu requires the pair not to be a yakuhai (wind or dragon)
  const pairObject = convertTilesToObjects([pair])[0];
  const isJihai = pairObject.suit === 'jihai';
  const isYakuhaiPair = isJihai && (
    ['haku', 'hatsu', 'chun'].includes(pairObject.value) ||
    pairObject.value === options.baKaze ||
    pairObject.value === options.jiKaze
  );
  if (isYakuhaiPair) return false;

  // Pinfu requires Ryanmen wait (両面待ち)
  if (waitShape !== 'ryanmen') return false;

  return true;
};

// Function to check for Sanshoku Doujun (三色同順)
const isSanshokuDoujun = (decomposition) => {
  if (!decomposition) return false;
  const shuntsuMelds = decomposition.melds.filter(meld => meld.type === 'shuntsu');

  // Group shuntsu by their values (e.g., '123', '234')
  const shuntsuGroups = {};
  shuntsuMelds.forEach(meld => {
    const sortedTiles = sortTiles(convertTilesToObjects(meld.tiles));
    const valueString = sortedTiles.map(t => t.value).join(''); // e.g., "123"
    const suit = sortedTiles[0].suit; // e.g., "manzu"

    if (!shuntsuGroups[valueString]) {
      shuntsuGroups[valueString] = new Set();
    }
    shuntsuGroups[valueString].add(suit);
  });

  for (const valueString in shuntsuGroups) {
    if (shuntsuGroups[valueString].size === 3) { // Found sequences in all three suits
      return true;
    }
  }
  return false;
};

// Function to check for Toitoihou (対々和)
const isToitoihou = (decomposition) => {
  if (!decomposition) return false;
  // Toitoihou requires all melds to be kotsu (triplets)
  return decomposition.melds.every(meld => meld.type === 'kotsu');
};

// Function to check for Sanankou (三暗刻)
const isSanankou = (decomposition, winningTile, options) => {
  if (!decomposition) return false;

  let closedKotsuCount = 0;
  decomposition.melds.forEach(meld => {
    if (meld.type === 'kotsu') {
      // A kotsu is closed if it was not formed by a ron win on that tile
      // For simplicity, assuming all kotsu are closed unless the winning tile completed it by ron
      if (options.isTsumo || (meld.tiles[0] !== winningTile && meld.tiles[1] !== winningTile && meld.tiles[2] !== winningTile)) {
        closedKotsuCount++;
      }
    }
  });

  // If the winning tile completed a kotsu, and it was a ron win, that kotsu is open.
  // So, we don't count it as a closed kotsu for Sanankou.
  // This logic needs to be more precise based on how the kotsu was formed.
  if (!options.isTsumo && decomposition.winningTileRole === 'kotsu') {
    // If the winning tile completed a kotsu by ron, that kotsu is open.
    // So, we don't count it as a closed kotsu for Sanankou.
    // This logic needs to be more precise based on how the kotsu was formed.
    // For now, we assume if winningTileRole is kotsu, it was a ron win on that kotsu, making it open.
    closedKotsuCount--; // Decrement if the winning tile completed a kotsu by ron
  }

  return closedKotsuCount >= 3;
};

// Function to check for Chanta (混全帯么九)
const isChanta = (decomposition) => {
  if (!decomposition) return false;

  const { pair, melds } = decomposition;

  // All melds and the pair must contain at least one yaochuuhai (1, 9, or honor tile)
  const yaochuuhai = [
    '1m', '9m', '1p', '9p', '1s', '9s',
    'ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun'
  ];

  // Check pair
  if (!yaochuuhai.includes(pair)) return false;

  // Check melds
  for (const meld of melds) {
    let meldHasYaochuuhai = false;
    for (const tile of meld.tiles) {
      if (yaochuuhai.includes(tile)) {
        meldHasYaochuuhai = true;
        break;
      }
    }
    if (!meldHasYaochuuhai) return false;
  }

  // No simple tiles (2-8) should be present in any shuntsu
  for (const meld of melds) {
    if (meld.type === 'shuntsu') {
      const sortedTiles = sortTiles(convertTilesToObjects(meld.tiles));
      if (sortedTiles[0].value !== 1 && sortedTiles[0].value !== 7) {
        return false; // Shuntsu must be 123 or 789
      }
    }
  }

  return true;
};

// Function to check for Junchan (純全帯么九)
const isJunchan = (decomposition) => {
  if (!decomposition) return false;

  const { pair, melds } = decomposition;

  // All melds and the pair must contain only terminal tiles (1 or 9)
  const terminalTiles = [
    '1m', '9m', '1p', '9p', '1s', '9s'
  ];

  // Check pair
  if (!terminalTiles.includes(pair)) return false;

  // Check melds
  for (const meld of melds) {
    let meldHasOnlyTerminal = true;
    for (const tile of meld.tiles) {
      if (!terminalTiles.includes(tile)) {
        meldHasOnlyTerminal = false;
        break;
      }
    }
    if (!meldHasOnlyTerminal) return false;
  }

  // No honor tiles (jihai) should be present in the hand
  const allTilesInHand = [decomposition.pair, ...decomposition.melds.flatMap(m => m.tiles)];
  for (const tile of allTilesInHand) {
    const tileObject = convertTilesToObjects([tile])[0];
    if (tileObject.suit === 'jihai') {
      return false;
    }
  }

  // All shuntsu must be 123 or 789
  for (const meld of melds) {
    if (meld.type === 'shuntsu') {
      const sortedTiles = sortTiles(convertTilesToObjects(meld.tiles));
      if (!((sortedTiles[0].value === 1 && sortedTiles[1].value === 2 && sortedTiles[2].value === 3) ||
            (sortedTiles[0].value === 7 && sortedTiles[1].value === 8 && sortedTiles[2].value === 9))) {
        return false;
      }
    }
  }

  return true;
};

// Function to check for Ittsuu (一気通貫)
const isIttsuu = (decomposition) => {
  if (!decomposition) return false;
  const shuntsuMelds = decomposition.melds.filter(meld => meld.type === 'shuntsu');

  const suits = ['m', 'p', 's'];
  for (const suit of suits) {
    const has123 = shuntsuMelds.some(meld => {
      const sortedTiles = sortTiles(convertTilesToObjects(meld.tiles));
      return sortedTiles[0].value === 1 && sortedTiles[0].suit.charAt(0) === suit;
    });
    const has456 = shuntsuMelds.some(meld => {
      const sortedTiles = sortTiles(convertTilesToObjects(meld.tiles));
      return sortedTiles[0].value === 4 && sortedTiles[0].suit.charAt(0) === suit;
    });
    const has789 = shuntsuMelds.some(meld => {
      const sortedTiles = sortTiles(convertTilesToObjects(meld.tiles));
      return sortedTiles[0].value === 7 && sortedTiles[0].suit.charAt(0) === suit;
    });

    if (has123 && has456 && has789) {
      return true;
    }
  }
  return false;
};

// Function to check for Honitsu (混一色)
const isHonitsu = (hand) => {
  const tileObjects = convertTilesToObjects(hand);
  const suitsInHand = new Set();
  let hasJihai = false;

  for (const tile of tileObjects) {
    if (tile.suit === 'jihai') {
      hasJihai = true;
    } else {
      suitsInHand.add(tile.suit);
    }
  }

  // Must have only one suit (manzu, pinzu, or souzu) and can have jihai
  return suitsInHand.size <= 1 && hasJihai;
};

// Function to check for Chinitsu (清一色)
const isChinitsu = (hand) => {
  const tileObjects = convertTilesToObjects(hand);
  const suitsInHand = new Set();

  for (const tile of tileObjects) {
    if (tile.suit === 'jihai') {
      return false; // Cannot have jihai for Chinitsu
    } else {
      suitsInHand.add(tile.suit);
    }
  }

  // Must have only one suit (manzu, pinzu, or souzu)
  return suitsInHand.size === 1;
};

// Function to check for Ryanpeikou (二盃口)
const isRyanpeikou = (decomposition) => {
  if (!decomposition) return false;
  const shuntsuMelds = decomposition.melds.filter(meld => meld.type === 'shuntsu');

  const shuntsuStrings = shuntsuMelds.map(meld => meld.tiles.sort().join(''));
  const shuntsuCounts = {};
  shuntsuStrings.forEach(s => {
    shuntsuCounts[s] = (shuntsuCounts[s] || 0) + 1;
  });

  let pairsOfShuntsu = 0;
  for (const s in shuntsuCounts) {
    if (shuntsuCounts[s] >= 2) {
      pairsOfShuntsu++;
    }
  }
  return pairsOfShuntsu === 2;
};

// Function to check for Daisangen (大三元)
const isDaisangen = (tileCounts) => {
  return tileCounts['haku'] >= 3 && tileCounts['hatsu'] >= 3 && tileCounts['chun'] >= 3;
};

// Function to check for Suuankou (四暗刻)
const isSuuankou = (decomposition, winningTile, options) => {
  if (!decomposition) return false;

  let closedKotsuCount = 0;
  decomposition.melds.forEach(meld => {
    if (meld.type === 'kotsu') {
      // A kotsu is closed if it was not formed by a ron win on that tile
      if (options.isTsumo || (meld.tiles[0] !== winningTile && meld.tiles[1] !== winningTile && meld.tiles[2] !== winningTile)) {
        closedKotsuCount++;
      }
    }
  });

  // Suuankou requires 4 closed kotsu
  if (closedKotsuCount === 4) {
    // Check for Suuankou Tanki (四暗刻単騎)
    if (decomposition.waitShape === 'tanki') {
      return 'suuankou_tanki'; // Double Yakuman
    } else {
      return 'suuankou'; // Single Yakuman
    }
  }
  return false;
};

// Function to check for Daisuurou (大四喜)
const isDaisuurou = (tileCounts) => {
  const windTiles = ['ton', 'nan', 'shaa', 'pei'];
  return windTiles.every(wind => tileCounts[wind] >= 3);
};

// Function to check for Shousuushii (小四喜)
const isShousuushii = (decomposition) => {
  if (!decomposition) return false;
  const { pair, melds } = decomposition;
  const windTiles = ['ton', 'nan', 'shaa', 'pei'];

  // Check if the pair is a wind tile
  if (!windTiles.includes(pair)) return false;

  // Check if the other three wind tiles are kotsu
  let kotsuWindCount = 0;
  for (const meld of melds) {
    if (meld.type === 'kotsu' && windTiles.includes(meld.tiles[0])) {
      kotsuWindCount++;
    }
  }
  return kotsuWindCount === 3;
};

// Function to check for Tsuuiisou (字一色)
const isTsuuiisou = (hand) => {
  const tileObjects = convertTilesToObjects(hand);
  return tileObjects.every(tile => tile.suit === 'jihai');
};

// Function to check for Ryuuiisou (緑一色)
const isRyuuiisou = (hand) => {
  const greenTiles = [
    '2s', '3s', '4s', '6s', '8s', 'hatsu'
  ];
  return hand.every(tile => greenTiles.includes(tile));
};

// Function to check for Chinroutou (清老頭)
const isChinroutou = (hand) => {
  const terminalTiles = [
    '1m', '9m', '1p', '9p', '1s', '9s'
  ];
  return hand.every(tile => terminalTiles.includes(tile));
};

// Function to check for Suukantsu (四槓子)
const isSuukantsu = (hand) => {
  const tileCounts = countTiles(hand);
  let kantsuCount = 0;
  for (const tile in tileCounts) {
    if (tileCounts[tile] === 4) {
      kantsuCount++;
    }
  }
  return kantsuCount === 4;
};

// Function to check for Chuuren Poutou (九蓮宝燈)
const isChuurenPoutou = (hand, winningTile) => {
  if (hand.length !== 14) return false;

  const tileCounts = countTiles(hand);
  const suits = ['m', 'p', 's'];

  for (const suitChar of suits) {
    const suitTiles = Object.keys(tileCounts).filter(tile => tile.endsWith(suitChar));
    if (suitTiles.length === 0) continue; // No tiles of this suit

    let has111 = tileCounts[`1${suitChar}`] >= 3;
    let has999 = tileCounts[`9${suitChar}`] >= 3;
    let hasMiddle = true;
    for (let i = 2; i <= 8; i++) {
      if (tileCounts[`${i}${suitChar}`] === undefined || tileCounts[`${i}${suitChar}`] === 0) {
        hasMiddle = false;
        break;
      }
    }

    if (has111 && has999 && hasMiddle) {
      // Check for pure Chuuren Poutou (winning tile is one of the 9 types)
      const requiredTiles = [
        `1${suitChar}`, `1${suitChar}`, `1${suitChar}`,
        `2${suitChar}`, `3${suitChar}`, `4${suitChar}`, `5${suitChar}`, `6${suitChar}`, `7${suitChar}`, `8${suitChar}`,
        `9${suitChar}`, `9${suitChar}`, `9${suitChar}`
      ];
      const tempHandCounts = { ...tileCounts };
      let isPure = true;
      for (const tile of requiredTiles) {
        if (tempHandCounts[tile] && tempHandCounts[tile] > 0) {
          tempHandCounts[tile]--;
        } else {
          isPure = false;
          break;
        }
      }

      if (isPure && tempHandCounts[winningTile] === 1) {
        return 'pure_chuuren'; // Double Yakuman
      } else if (isPure) { // If it's the 13-tile form and winning tile completes it
        return 'chuuren'; // Single Yakuman
      }
    }
  }
  return false;
};

// Function to check for Tenhou (天和)
const isTenhou = (options) => {
  // Tenhou is only possible for the dealer on their first draw
  // For simplicity, we assume if isTsumo is true and it's the first turn (no prior discards/melds)
  // This requires more game state to be truly accurate.
  return options.isTsumo && options.isDealer && options.isFirstTurn; // Placeholder for now
};

// Function to check for Chiihou (地和)
const isChiihou = (options) => {
  // Chiihou is only possible for a non-dealer on their first draw
  // For simplicity, we assume if isTsumo is true and it's the first turn (no prior discards/melds)
  // This requires more game state to be truly accurate.
  return options.isTsumo && !options.isDealer && options.isFirstTurn; // Placeholder for now
};

// Function to check for San Kantsu (三槓子)
const isSanKantsu = (hand) => {
  const tileCounts = countTiles(hand);
  let kantsuCount = 0;
  for (const tile in tileCounts) {
    if (tileCounts[tile] === 4) {
      kantsuCount++;
    }
  }
  return kantsuCount === 3;
};

// Function to check for Sanshoku Dokou (三色同刻)
const isSanshokuDokou = (decomposition) => {
  if (!decomposition) return false;
  const kotsuMelds = decomposition.melds.filter(meld => meld.type === 'kotsu');

  const kotsuGroups = {};
  kotsuMelds.forEach(meld => {
    const tileObject = convertTilesToObjects([meld.tiles[0]])[0];
    const value = tileObject.value;
    const suit = tileObject.suit;

    if (!kotsuGroups[value]) {
      kotsuGroups[value] = new Set();
    }
    kotsuGroups[value].add(suit);
  });

  for (const value in kotsuGroups) {
    if (kotsuGroups[value].size === 3) { // Found kotsu in all three suits for the same value
      return true;
    }
  }
  return false;
};

// Function to check for Shousangen (小三元)
const isShousangen = (decomposition) => {
  if (!decomposition) return false;
  const { pair, melds } = decomposition;
  const dragonTiles = ['haku', 'hatsu', 'chun'];

  // Check if the pair is a dragon tile
  if (!dragonTiles.includes(pair)) return false;

  // Check if the other two dragon tiles are kotsu
  let kotsuDragonCount = 0;
  for (const meld of melds) {
    if (meld.type === 'kotsu' && dragonTiles.includes(meld.tiles[0])) {
      kotsuDragonCount++;
    }
  }
  return kotsuDragonCount === 2;
};

// Function to check for Honroutou (混老頭)
const isHonroutou = (hand, allDecompositions, chiitoitsu) => {
  const yaochuuhai = [
    '1m', '9m', '1p', '9p', '1s', '9s',
    'ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun'
  ];
  // All tiles must be yaochuuhai
  if (!hand.every(tile => yaochuuhai.includes(tile))) {
    return false;
  }

  // Must be Toitoihou or Chiitoitsu
  if (chiitoitsu) {
    return true;
  }
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isToitoihou(decomposition)) {
        return true;
      }
    }
  }
  return false;
};


// Function to calculate Fu
const calculateFu = (hand, allDecompositions, winningTile, options) => {
  let maxFu = 0;

  // If no standard hand combinations, return 0 fu (or handle as error)
  if (allDecompositions.length === 0) {
    return 0;
  }

  for (const decomposition of allDecompositions) {
    let currentFu = 20; // Base fu for Ron or Tsumo (unless Pinfu Tsumo)

    // Handle Pinfu Tsumo special case
    if (options.isTsumo && isPinfu(decomposition, winningTile, options)) {
      currentFu = 20; // Pinfu Tsumo is always 20 fu
    } else {
      // Add 2 fu for Tsumo (if not Pinfu)
      if (options.isTsumo) {
        currentFu += 2;
      }
    }

    // Pair Fu
    const pairTile = decomposition.pair;
    const pairObject = convertTilesToObjects([pairTile])[0];
    if (pairObject.suit === 'jihai') {
      if (['haku', 'hatsu', 'chun'].includes(pairObject.value)) {
        currentFu += 2; // Dragon pair
      }
      if (pairObject.value === options.baKaze) {
        currentFu += 2; // BaKaze pair
      }
      if (pairObject.value === options.jiKaze) {
        currentFu += 2; // JiKaze pair
      }
    }

    // Meld Fu
    decomposition.melds.forEach(meld => {
      const meldTile = convertTilesToObjects([meld.tiles[0]])[0];
      const isTerminalOrHonor = meldTile.suit === 'jihai' || meldTile.value === 1 || meldTile.value === 9;

      if (meld.type === 'kotsu') {
        // Assuming all kotsu are closed for now (no open melds input yet)
        if (isTerminalOrHonor) {
          currentFu += 8; // Closed terminal/honor triplet
        } else {
          currentFu += 4; // Closed simple triplet
        }
      }
      // Shuntsu (sequences) do not add fu
    });

    // Add wait fu
    switch (decomposition.waitShape) {
      case 'tanki':
      case 'kanchan':
      case 'penchan':
        currentFu += 2;
        break;
      case 'ryanmen':
      case 'shanpon':
        // 0 fu for these waits
        break;
      default:
        break;
    }

    // Round fu up to the nearest 10
    currentFu = Math.ceil(currentFu / 10) * 10;

    if (currentFu > maxFu) {
      maxFu = currentFu;
    }
  }

  return maxFu;
};


export const calculateScore = (hand, winningTile, options) => {
  console.log("Calculating score for hand:", hand);
  console.log("Winning Tile:", winningTile);
  console.log("With options:", options);

  // Ensure hand has 14 tiles for standard calculations, or 13/14 for Kokushi Musou
  if (hand.length < 13 || hand.length > 14) {
    return {
      han: 0,
      fu: 0,
      yakus: [{ name: "手牌が13枚または14枚ではありません。", han: 0 }],
      score: 0,
      message: "手牌が13枚または14枚ではありません。"
    };
  }

  const processedHand = convertTilesToObjects(hand);
  const sortedHand = sortTiles(processedHand);
  console.log("Processed and sorted hand:", sortedHand);

  const tileCounts = countTiles(hand);
  console.log("Tile counts:", tileCounts);

  let totalHan = 0;
  let fu = 0; // Initialize fu to 0, will be calculated

  let yakus = [];

  // Get all possible standard hand decompositions (needed for some yakuman checks)
  let allDecompositions = [];
  // Temporarily remove winning tile for decomposition if it's a 14-tile hand
  if (hand.length === 14) {
    const thirteenTileHand = [...hand];
    const winningTileIndex = thirteenTileHand.indexOf(winningTile);
    if (winningTileIndex > -1) {
      thirteenTileHand.splice(winningTileIndex, 1);
    } else {
      console.warn("Winning tile not found in hand for decomposition.");
      return {
        han: 0,
        fu: 0,
        yakus: [{ name: "和了牌が手牌に含まれていません。", han: 0 }],
        score: 0,
        message: "和了牌が手牌に含まれていません。"
      };
    }
    allDecompositions = decomposeHand(thirteenTileHand, winningTile);
  }


  // Check for Yakuman first
  const kokushiMusou = isKokushiMusou(hand);
  const daisangen = isDaisangen(tileCounts);
  const suuankouResult = allDecompositions.length > 0 ? isSuuankou(allDecompositions[0], winningTile, options) : false; // Assuming first decomposition for now
  const daisuurou = isDaisuurou(tileCounts);
  const shousuushii = allDecompositions.length > 0 ? isShousuushii(allDecompositions[0]) : false; // Assuming first decomposition for now
  const tsuuiisou = isTsuuiisou(hand);
  const ryuuiisou = isRyuuiisou(hand);
  const chinroutou = isChinroutou(hand);
  const suukantsu = isSuukantsu(hand);
  const chuurenPoutouResult = isChuurenPoutou(hand, winningTile);
  const sanKantsu = isSanKantsu(hand);
  const sanshokuDokou = allDecompositions.length > 0 ? isSanshokuDokou(allDecompositions[0]) : false; // Assuming first decomposition
  const shousangen = allDecompositions.length > 0 ? isShousangen(allDecompositions[0]) : false; // Assuming first decomposition
  const honroutou = isHonroutou(hand, allDecompositions, isChiitoitsu(hand));

  // Contextual Yakuman (Tenhou, Chiihou) - simplified for now
  let isTenhouFound = isTenhou(options);
  let isChiihouFound = isChiihou(options);


  if (kokushiMusou) {
    yakus.push({ name: "国士無双", han: 13 });
  } else if (daisuurou) {
    yakus.push({ name: "大四喜", han: 26 }); // Double Yakuman
  } else if (suuankouResult === 'suuankou_tanki') {
    yakus.push({ name: "四暗刻単騎", han: 26 }); // Double Yakuman
  } else if (chuurenPoutouResult === 'pure_chuuren') {
    yakus.push({ name: "純正九蓮宝燈", han: 26 }); // Double Yakuman
  } else if (daisangen) {
    yakus.push({ name: "大三元", han: 13 });
  } else if (suuankouResult === 'suuankou') {
    yakus.push({ name: "四暗刻", han: 13 });
  } else if (shousuushii) {
    yakus.push({ name: "小四喜", han: 13 });
  } else if (tsuuiisou) {
    yakus.push({ name: "字一色", han: 13 });
  } else if (ryuuiisou) {
    yakus.push({ name: "緑一色", han: 13 });
  } else if (chinroutou) {
    yakus.push({ name: "清老頭", han: 13 });
  } else if (suukantsu) {
    yakus.push({ name: "四槓子", han: 13 });
  } else if (chuurenPoutouResult === 'chuuren') {
    yakus.push({ name: "九蓮宝燈", han: 13 });
  } else if (isTenhouFound) {
    yakus.push({ name: "天和", han: 13 });
  } else if (isChiihouFound) {
    yakus.push({ name: "地和", han: 13 });
  }

  // If any yakuman is found, set fu to 0 and return fixed score
  if (yakus.some(yaku => yaku.han >= 13)) {
    fu = 0;
    let yakumanCount = 0;
    yakus.forEach(yaku => {
      if (yaku.han === 13) yakumanCount = Math.max(yakumanCount, 1);
      if (yaku.han === 26) yakumanCount = Math.max(yakumanCount, 2);
    });

    const score = yakumanCount * 32000; // Assuming non-dealer for now
    return { han: yakumanCount * 13, fu, yakus, score, message: `役満 ${yakumanCount}倍役満 ${score}点` };
  }

  // If not Yakuman, proceed with 14-tile standard/chiitoitsu checks
  if (hand.length !== 14) {
    return {
      han: 0,
      fu: 0,
      yakus: [{ name: "手牌が14枚ではありません。標準形または七対子ではありません。", han: 0 }],
      score: 0,
      message: "手牌が14枚ではありません。標準形または七対子ではありません。"
    };
  }

  // Check for Chiitoitsu
  const chiitoitsu = isChiitoitsu(hand);
  if (chiitoitsu) {
    console.log("Hand is Chiitoitsu.");
    yakus.push({ name: "七対子", han: 2 });
    fu = 25; // Chiitoitsu is always 25 fu
  }

  // Get all possible standard hand decompositions
  // allDecompositions is already calculated above

  if (!chiitoitsu && allDecompositions.length > 0) {
    // Calculate fu for standard hand, choosing the highest fu among combinations
    fu = calculateFu(hand, allDecompositions, winningTile, options);
  }

  // Check for Pinfu (only if it's a standard hand and not Chiitoitsu)
  let isPinfuFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isPinfu(decomposition, winningTile, options)) {
        isPinfuFound = true;
        break;
      }
    }
  }

  if (isPinfuFound) {
    yakus.push({ name: "平和", han: 1 });
  }


  // Check for Yakuhai (only if it's a standard hand)
  if (allDecompositions.length > 0) {
    const yakuhaiFound = isYakuhai(tileCounts, options.baKaze, options.jiKaze);
    yakuhaiFound.forEach(yaku => {
      yakus.push(yaku);
    });
  }

  // Check for Tanyao (only if it's a standard hand)
  if (allDecompositions.length > 0 && isTanyao(hand)) {
    yakus.push({ name: "断么九", han: 1 });
  }

  // Add basic han for richi (dummy for now)
  if (options.isRichi) {
    yakus.push({ name: "リーチ", han: 1 });
  }

  // Check for Ippatsu (一発)
  if (options.isIppatsu && options.isRichi) {
    yakus.push({ name: "一発", han: 1 });
  }

  // Check for Double Riichi (ダブルリーチ)
  if (options.isDoubleRiichi) {
    yakus.push({ name: "ダブルリーチ", han: 2 });
  }

  // Check for Menzen Tsumo (門前清自摸和)
  // Applies if it's a Tsumo win and not an open hand (i.e., not Chiitoitsu or Kokushi Musou, and allDecompositions has results)
  if (options.isTsumo && !chiitoitsu && !kokushiMusou && allDecompositions.length > 0) {
    yakus.push({ name: "門前清自摸和", han: 1 });
  }

  // Check for Iipeikou (一盃口)
  // This needs to be checked for each standard hand combination
  let isIipeikouFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      const shuntsuMelds = decomposition.melds.filter(meld => meld.type === 'shuntsu');
      const shuntsuStrings = shuntsuMelds.map(meld => meld.tiles.sort().join(''));
      const uniqueShuntsu = new Set(shuntsuStrings);
      if (shuntsuStrings.length - uniqueShuntsu.size === 1) { // One pair of identical shuntsu
        isIipeikouFound = true;
        break;
      }
    }
  }

  // Check for Ryanpeikou (二盃口)
  let isRyanpeikouFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isRyanpeikou(decomposition)) {
        isRyanpeikouFound = true;
        break;
      }
    }
  }

  if (isRyanpeikouFound) {
    yakus.push({ name: "二盃口", han: 3 });
    isIipeikouFound = false; // If Ryanpeikou is found, Iipeikou is not counted
  }

  if (isIipeikouFound) {
    yakus.push({ name: "一盃口", han: 1 });
  }

  // Check for Sanshoku Doujun (三色同順)
  let isSanshokuDoujunFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isSanshokuDoujun(decomposition)) {
        isSanshokuDoujunFound = true;
        break;
      }
      // If it's an open hand, Sanshoku Doujun is 1 han. For now, assuming closed.
    }
  }
  if (isSanshokuDoujunFound) {
    yakus.push({ name: "三色同順", han: 2 }); // Closed Sanshoku Doujun is 2 han
  }

  // Check for Toitoihou (対々和)
  let isToitoihouFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isToitoihou(decomposition)) {
        isToitoihouFound = true;
        break;
      }
    }
  }
  if (isToitoihouFound) {
    yakus.push({ name: "対々和", han: 2 });
  }

  // Check for Sanankou (三暗刻)
  let isSanankouFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isSanankou(decomposition, winningTile, options)) {
        isSanankouFound = true;
        break;
      }
    }
  }
  if (isSanankouFound) {
    yakus.push({ name: "三暗刻", han: 2 });
  }

  // Check for Chanta (混全帯么九)
  let isChantaFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isChanta(decomposition)) {
        isChantaFound = true;
        break;
      }
    }
  }
  if (isChantaFound) {
    yakus.push({ name: "混全帯么九", han: 2 }); // Closed Chanta is 2 han
  }

  // Check for Junchan (純全帯么九)
  let isJunchanFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isJunchan(decomposition)) {
        isJunchanFound = true;
        break;
      }
    }
  }
  if (isJunchanFound) {
    yakus.push({ name: "純全帯么九", han: 3 }); // Closed Junchan is 3 han
  }

  // Check for Ittsuu (一気通貫)
  let isIttsuuFound = false;
  if (allDecompositions.length > 0) {
    for (const decomposition of allDecompositions) {
      if (isIttsuu(decomposition)) {
        isIttsuuFound = true;
        break;
      }
    }
  }
  if (isIttsuuFound) {
    yakus.push({ name: "一気通貫", han: 2 }); // Closed Ittsuu is 2 han
  }

  // Check for Honitsu (混一色)
  let isHonitsuFound = false;
  if (isHonitsu(hand)) {
    isHonitsuFound = true;
  }
  if (isHonitsuFound) {
    yakus.push({ name: "混一色", han: 3 }); // Closed Honitsu is 3 han
  }

  // Check for Chinitsu (清一色)
  let isChinitsuFound = false;
  if (isChinitsu(hand)) {
    isChinitsuFound = true;
  }
  if (isChinitsuFound) {
    yakus.push({ name: "清一色", han: 6 }); // Closed Chinitsu is 6 han
  }

  // Check for San Kantsu (三槓子)
  if (sanKantsu) {
    yakus.push({ name: "三槓子", han: 2 });
  }

  // Check for Sanshoku Dokou (三色同刻)
  if (sanshokuDokou) {
    yakus.push({ name: "三色同刻", han: 2 });
  }

  // Check for Shousangen (小三元)
  if (shousangen) {
    yakus.push({ name: "小三元", han: 2 });
  }

  // Check for Honroutou (混老頭)
  if (honroutou) {
    yakus.push({ name: "混老頭", han: 2 });
  }

  // Calculate total han from yakus
  yakus.forEach(yaku => {
    totalHan += yaku.han;
  });

  // Add dora to han
  totalHan += options.doraCount;

  // If no specific yaku found yet, and it's a standard hand, add a placeholder
  if (yakus.length === 0 && allDecompositions.length > 0) {
      yakus.push({ name: "役なし (標準形)", han: 0 }); // This will be replaced by actual yaku
  } else if (yakus.length === 0 && !chiitoitsu && !kokushiMusou) {
      yakus.push({ name: "役なし", han: 0 });
  }


  // Dummy score calculation (will be replaced by actual calculation)
  let score = 0;
  if (totalHan === 0) {
    score = 0; // No yaku, no score
  } else if (totalHan < 5) {
    score = fu * Math.pow(2, 2 + totalHan);
    // Round to nearest 100 for score
    score = Math.ceil(score / 100) * 100;
  } else if (totalHan === 5) {
    score = 8000; // Mangan
  } else if (totalHan === 6 || totalHan === 7) {
    score = 12000; // Haneman
  } else if (totalHan === 8 || totalHan === 9 || totalHan === 10) {
    score = 16000; // Baiman
  } else if (totalHan === 11 || totalHan === 12) {
    score = 24000; // Sanbaiman
  } else {
    score = 32000; // Yakuman (or Kazoe Yakuman)
  }

  let message = "";
  if (totalHan === 0) {
    message = "役なし";
  } else if (totalHan < 5) {
    message = `${totalHan}翻 ${fu}符 ${score}点`;
  } else if (totalHan === 5) {
    message = `満貫 ${score}点`;
  } else if (totalHan === 6 || totalHan === 7) {
    message = `跳満 ${score}点`;
  } else if (totalHan === 8 || totalHan === 9 || totalHan === 10) {
    message = `倍満 ${score}点`;
  } else if (totalHan === 11 || totalHan === 12) {
    message = `三倍満 ${score}点`;
  } else {
    message = `役満 ${score}点`;
  }


  const result = {
    han: totalHan,
    fu: fu,
    yakus: yakus,
    score: score,
    message: message,
    doraDetails: {
      omoteDoraCount: options.omoteDoraCount,
      uraDoraCount: options.uraDoraCount,
      akaDoraCount: options.akaDoraCount
    }
  };

  return result;
};