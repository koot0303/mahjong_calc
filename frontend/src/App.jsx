import React, { useState, useEffect } from 'react';
import './App.css';
import { calculateScore } from './mahjongCalculator';

function App() {
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [winningTile, setWinningTile] = useState(null);
  const [doraIndicators, setDoraIndicators] = useState([]);
  const [uradoraIndicators, setUradoraIndicators] = useState([]);
  const [calculationResult, setCalculationResult] = useState(null);
  const [options, setOptions] = useState({
    isTsumo: false,
    isRichi: false,
    isIppatsu: false,
    isDoubleRiichi: false,
    baKaze: 'ton',
    jiKaze: 'ton',
    isDealer: false,
    isFirstTurn: false,
    doraIndicators: [],
    uradoraIndicators: [],
    omoteDora: [],
    uraDora: [],
    omoteDoraCount: 0,
    uraDoraCount: 0,
    akaDoraCount: 0,
  });

  const tiles = {
    manzu: ['1m', '2m', '3m', '4m', '5m', 'aka1-66-90-l', '6m', '7m', '8m', '9m'],
    pinzu: ['1p', '2p', '3p', '4p', '5p', 'aka2-66-90-l', '6p', '7p', '8p', '9p'],
    souzu: ['1s', '2s', '3s', '4s', '5s', 'aka3-66-90-l', '6s', '7s', '8s', '9s'],
    jihai: ['ton', 'nan', 'shaa', 'pei', 'haku', 'hatsu', 'chun']
  };

  const getBaseTile = (tile) => {
    if (tile === 'aka1-66-90-l') return '5m';
    if (tile === 'aka2-66-90-l') return '5p';
    if (tile === 'aka3-66-90-l') return '5s';
    return tile;
  };

  // Dora and Uradora calculation logic
  useEffect(() => {
    let omoteDora = [];
    let uraDora = [];
    let omoteDoraCount = 0;
    let uraDoraCount = 0;

    // Calculate Omote Dora
    doraIndicators.forEach(indicator => {
      const doraValue = getDoraValue(indicator);
      if (doraValue) {
        omoteDora.push(doraValue);
        omoteDoraCount += selectedTiles.filter(tile => getBaseTile(tile) === doraValue).length;
      }
    });

    // Calculate Ura Dora (only if Riichi is true)
    if (options.isRichi) {
      uradoraIndicators.forEach(indicator => {
        const doraValue = getDoraValue(indicator);
        if (doraValue) {
          uraDora.push(doraValue);
          uraDoraCount += selectedTiles.filter(tile => getBaseTile(tile) === doraValue).length;
        }
      });
    }

    // Calculate Red Dora
    const akaDoraCount = selectedTiles.filter(tile => ['aka1-66-90-l', 'aka2-66-90-l', 'aka3-66-90-l'].includes(tile)).length;
    const totalDoraCount = omoteDoraCount + uraDoraCount + akaDoraCount;

    setOptions(prevOptions => ({
      ...prevOptions,
      doraCount: totalDoraCount,
      omoteDora: omoteDora,
      uraDora: uraDora,
      omoteDoraCount: omoteDoraCount,
      uraDoraCount: uraDoraCount,
      akaDoraCount: akaDoraCount
    }));
  }, [selectedTiles, doraIndicators, uradoraIndicators, options.isRichi]);

  const getDoraValue = (indicator) => {
    if (!indicator) return null;

    const suit = indicator.slice(-1);
    const value = indicator.slice(0, -1);

    if (['m', 'p', 's'].includes(suit)) {
      let nextValue = parseInt(value) + 1;
      if (nextValue > 9) nextValue = 1;
      return `${nextValue}${suit}`;
    } else { // jihai
      const windOrder = ['ton', 'nan', 'shaa', 'pei'];
      const dragonOrder = ['haku', 'hatsu', 'chun'];
      if (windOrder.includes(indicator)) {
        const index = windOrder.indexOf(indicator);
        return windOrder[(index + 1) % 4];
      }
      if (dragonOrder.includes(indicator)) {
        const index = dragonOrder.indexOf(indicator);
        return dragonOrder[(index + 1) % 3];
      }
    }
    return null;
  };


  const handleTileClick = (tile) => {
    if (selectedTiles.length < 14) {
      setSelectedTiles([...selectedTiles, tile].sort());
    } else {
      alert('手牌は14枚までです。');
    }
  };

  const handleWinningTileClick = (tile, index) => {
    setWinningTile({ tile, index });
  };

  const handleDoraIndicatorClick = (tile) => {
    if (doraIndicators.length < 5) {
      setDoraIndicators([...doraIndicators, tile]);
    } else {
      alert('ドラ表示牌は5個までです。');
    }
  };

  const removeDoraIndicator = (index) => {
    setDoraIndicators(doraIndicators.filter((_, i) => i !== index));
  };

  const handleUradoraIndicatorClick = (tile) => {
    if (uradoraIndicators.length < 5) { // Limit uradora to 5 as well
      setUradoraIndicators([...uradoraIndicators, tile]);
    } else {
      alert('裏ドラ表示牌は5個までです。');
    }
  };

  const removeUradoraIndicator = (index) => {
    setUradoraIndicators(uradoraIndicators.filter((_, i) => i !== index));
  };

  const clearTiles = () => {
    setSelectedTiles([]);
    setWinningTile(null);
    setDoraIndicators([]);
    setUradoraIndicators([]);
    setCalculationResult(null);
  };

  const handleOptionChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (name === 'isDoubleRiichi') {
      setOptions(prevOptions => ({
        ...prevOptions,
        isDoubleRiichi: checked,
        isRichi: checked ? true : prevOptions.isRichi
      }));
    } else if (name === 'isRichi' && !checked) {
      setOptions(prevOptions => ({
        ...prevOptions,
        isRichi: checked,
        isIppatsu: false,
        isDoubleRiichi: false
      }));
    } else {
      setOptions(prevOptions => ({
        ...prevOptions,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleCalculate = () => {
    if (selectedTiles.length === 0) {
      alert('手牌を入力してください。');
      return;
    }
    if (!winningTile) {
      alert('和了牌を選択してください。');
      return;
    }
    const result = calculateScore(selectedTiles, winningTile.tile, options);
    setCalculationResult(result);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">麻雀点数計算</h1>

      <div className="card mb-4">
        <div className="card-header">
          手牌選択
        </div>
        <div className="card-body">
          {Object.entries(tiles).map(([suit, tileList]) => (
            <div key={suit} className="mb-3">
              <h5>{suit === 'manzu' ? '萬子' : suit === 'pinzu' ? '筒子' : suit === 'souzu' ? '索子' : '字牌'}</h5>
              <div className="d-flex flex-wrap">
                {tileList.map(tile => (
                  <button
                    key={tile}
                    className="btn btn-outline-primary m-1 tile-button"
                    onClick={() => handleTileClick(tile)}
                  >
                    <img src={`${import.meta.env.BASE_URL}tiles/${tile}.png`} alt={tile} className="tile-image" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-danger mt-3" onClick={clearTiles}>手牌をクリア</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          現在の手牌 (和了牌をクリックして選択)
        </div>
        <div className="card-body">
          {selectedTiles.length === 0 ? (
            <p>手牌がありません。</p>
          ) : (
            <div className="d-flex flex-wrap">
              {selectedTiles.map((tile, index) => (
                <button
                  key={index}
                  className={`btn m-1 p-0 tile-button ${winningTile?.index === index ? 'winning-tile' : ''}`}
                  onClick={() => handleWinningTileClick(tile, index)}
                >
                  <img src={`${import.meta.env.BASE_URL}tiles/${tile}.png`} alt={tile} className="tile-image-display" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          ドラ表示牌選択
        </div>
        <div className="card-body">
          {doraIndicators.length > 0 ? (
            <div className="mb-3">
              選択中のドラ表示牌:
              {doraIndicators.map((indicator, index) => (
                <span key={index} className="d-inline-block me-2">
                  <img src={`${import.meta.env.BASE_URL}tiles/${indicator}.png`} alt={indicator} className="tile-image-display" />
                  <button className="btn btn-sm btn-outline-danger ms-1" onClick={() => removeDoraIndicator(index)}>x</button>
                </span>
              ))}
            </div>
          ) : (
            <p>ドラ表示牌を選択してください。</p>
          )}
          <div className="d-flex flex-wrap">
            {Object.entries(tiles).map(([suit, tileList]) => (
              <div key={suit} className="mb-2 me-2">
                {tileList.map(tile => (
                  <button
                    key={tile}
                    className="btn btn-outline-info btn-sm m-1 tile-button"
                    onClick={() => handleDoraIndicatorClick(tile)}
                  >
                    <img src={`${import.meta.env.BASE_URL}tiles/${tile}.png`} alt={tile} className="tile-image-small" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          裏ドラ表示牌選択 (リーチ時のみ有効)
        </div>
        <div className="card-body">
          {uradoraIndicators.length > 0 ? (
            <div className="mb-3">
              選択中の裏ドラ表示牌:
              {uradoraIndicators.map((indicator, index) => (
                <span key={index} className="d-inline-block me-2">
                  <img src={`${import.meta.env.BASE_URL}tiles/${indicator}.png`} alt={indicator} className="tile-image-display" />
                  <button className="btn btn-sm btn-outline-danger ms-1" onClick={() => removeUradoraIndicator(index)}>x</button>
                </span>
              ))}
            </div>
          ) : (
            <p>裏ドラ表示牌を選択してください。</p>
          )}
          <div className="d-flex flex-wrap">
            {Object.entries(tiles).map(([suit, tileList]) => (
              <div key={suit} className="mb-2 me-2">
                {tileList.map(tile => (
                  <button
                    key={tile}
                    className="btn btn-outline-info btn-sm m-1 tile-button"
                    onClick={() => handleUradoraIndicatorClick(tile)}
                    disabled={!options.isRichi} // Uradora only enabled if Riichi is checked
                  >
                    <img src={`${import.meta.env.BASE_URL}tiles/${tile}.png`} alt={tile} className="tile-image-small" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          計算条件
        </div>
        <div className="card-body">
          {/* ... existing options ... */}
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isTsumo"
              name="isTsumo"
              checked={options.isTsumo}
              onChange={handleOptionChange}
            />
            <label className="form-check-label" htmlFor="isTsumo">
              ツモ
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isRichi"
              name="isRichi"
              checked={options.isRichi}
              onChange={handleOptionChange}
            />
            <label className="form-check-label" htmlFor="isRichi">
              リーチ
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isIppatsu"
              name="isIppatsu"
              checked={options.isIppatsu}
              onChange={handleOptionChange}
              disabled={!options.isRichi} // Ippatsu requires Riichi
            />
            <label className="form-check-label" htmlFor="isIppatsu">
              一発
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isDoubleRiichi"
              name="isDoubleRiichi"
              checked={options.isDoubleRiichi}
              onChange={handleOptionChange}
              disabled={options.isRichi && !options.isDoubleRiichi}
            />
            <label className="form-check-label" htmlFor="isDoubleRiichi">
              ダブルリーチ
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isDealer"
              name="isDealer"
              checked={options.isDealer}
              onChange={handleOptionChange}
            />
            <label className="form-check-label" htmlFor="isDealer">
              親
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="isFirstTurn"
              name="isFirstTurn"
              checked={options.isFirstTurn}
              onChange={handleOptionChange}
            />
            <label className="form-check-label" htmlFor="isFirstTurn">
              最初のツモ
            </label>
          </div>
          <div className="mb-3">
            <label htmlFor="doraCount" className="form-label">ドラの数 (自動計算)</label>
            <input
              type="number"
              className="form-control"
              id="doraCount"
              name="doraCount"
              min="0"
              value={options.doraCount}
              readOnly // Make it read-only as it's calculated automatically
            />
          </div>
          <div className="mb-3">
            <label htmlFor="baKaze" className="form-label">場風</label>
            <select
              className="form-select"
              id="baKaze"
              name="baKaze"
              value={options.baKaze}
              onChange={handleOptionChange}
            >
              <option value="ton">東</option>
              <option value="nan">南</option>
              <option value="shaa">西</option>
              <option value="pei">北</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="jiKaze" className="form-label">自風</label>
            <select
              className="form-select"
              id="jiKaze"
              name="jiKaze"
              value={options.jiKaze}
              onChange={handleOptionChange}
            >
              <option value="ton">東</option>
              <option value="nan">南</option>
              <option value="shaa">西</option>
              <option value="pei">北</option>
            </select>
          </div>
          <button className="btn btn-success mt-3" onClick={handleCalculate}>計算</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          計算結果
        </div>
        <div className="card-body">
          {calculationResult ? (
            <div>
              <p><strong>{calculationResult.message}</strong></p>
              <p>翻数: {calculationResult.han}翻</p>
              <p>符: {calculationResult.fu}符</p>
              <p>役:</p>
              <ul>
                {calculationResult.yakus.map((yaku, index) => (
                  <li key={index}>{yaku.name} ({yaku.han}翻)</li>
                ))}
                {calculationResult.doraDetails.omoteDoraCount > 0 && (
                  <li>表ドラ: {calculationResult.doraDetails.omoteDoraCount}翻</li>
                )}
                {calculationResult.doraDetails.uraDoraCount > 0 && (
                  <li>裏ドラ: {calculationResult.doraDetails.uraDoraCount}翻</li>
                )}
                {calculationResult.doraDetails.akaDoraCount > 0 && (
                  <li>赤ドラ: {calculationResult.doraDetails.akaDoraCount}翻</li>
                )}
              </ul>
            </div>
          ) : (
            <p>「計算」ボタンを押すと結果が表示されます。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
