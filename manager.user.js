// ==UserScript==
// @name           Steam - Monster Summer Sale 2015: Minigame Manager
// @author         github.com/kton - reddit.com/user/o9k1/
// @version        0.0.1
// @match          http://steamcommunity.com/minigame/towerattack/
// @description    extends the game UI and does things
// @run-at         document-end
// ==/UserScript==

(function (){

  var config = {
    wait: {
      loadgame: 4500, // wait for game assets to load
      loaddata: 1500, // wait for game to connect
      updatedata: 1000, // how often the game data is synced
      updateui: 1000 // how often the userscript UI is refreshed
    }
  }

  var info = {
    version: '0.0.1',
    pane: document.querySelector('.leave_game_helper'),
    init: function (_pane) {
      var _info = document.createElement('span');
      var _wait = ~~(config.wait.loadgame/1000+config.wait.loaddata/1000);
      _info.innerHTML = 'Minigame Manager v' + info.version + ' loading in ~' + _wait + 's ...';

      _pane.innerHTML = '';
      _pane.appendChild(_info);

      setTimeout(
        function(){
          data.init(info.pane);
          _info.parentNode.removeChild(_info);
          info.expand(info.pane);
        }
      ,config.wait.loadgame);
    },
    expand: function (_pane) {
      _pane.style.right = '0px';
      _pane.style.top = '15px';
      _pane.style.width = '1000px';
      _pane.style.textAlign = 'center';
      _pane.style.zIndex = '9999';
    },
    abilities: { // via https://github.com/wchill/steamSummerMinigame/blob/master/Abilities%20And%20Upgrades%20list.md
      1: 'Fire Weapon',
      2: 'Change Lane',
      3: 'Respawn',
      4: 'Change Target',
      5: 'Morale Booster',
      6: 'Good Luck Charms',
      7: 'Medics',
      8: 'Metal Detector',
      9: 'Decrease Cooldowns',
      10: 'Tactical Nuke',
      11: 'Cluster Bomb',
      12: 'Napalm',
      13: 'Resurrection',
      14: 'Cripple Spawner',
      15: 'Cripple Monster',
      16: 'Max Elemental Damage',
      17: 'Raining Gold',
      18: 'Crit',
      19: 'Pumped Up',
      20: 'Throw Money at Screen',
      21: 'GOD MODE',
      22: 'Treasure!',
      23: 'Steal Health',
      24: 'Reflect Damage'
    },
    upgrades: {
      0: 'Light Armor',
      1: 'Auto-fire Cannon',
      2: 'Armor Piercing Round',
      3: '+Damage to Fire Monsters',
      4: '+Damage to Water Monsters',
      5: '+Damage to Air Monsters',
      6: '+Damage to Earth Monsters',
      7: 'Lucky Shot',
      8: 'Heavy Armor',
      9: 'Advanced Targeting',
      10: 'Explosive Rounds',
      11: 'Medics',
      12: 'Morale Booster',
      13: 'Good Luck Charms',
      14: 'Metal Detector',
      15: 'Decrease Cooldowns',
      16: 'Tactical Nuke',
      17: 'Cluster Bomb',
      18: 'Napalm',
      19: 'Boss Loot',
      20: 'Energy Shields',
      21: 'Farming Equipment',
      22: 'Railgun'
    },
    enemy: {
      type: {
        0: 'Spawner',
        1: 'Creep',
        2: 'Boss',
        3: 'Mini Boss',
        4: 'Treasure'
      },
      element: {
        1: 'Fire',
        2: 'Water',
        3: 'Air',
        4: 'Earth'
      }
    }

  };

  var data = {
    game: document.createElement('input'),
    player: document.createElement('input'),
    init: function (_pane) {
      _pane.appendChild(data.game);
      _pane.appendChild(data.player);

      var _script = document.createElement('script');
      _script.setAttribute('type','text/javascript');
      _script.innerHTML = " \
        var mgr_gamedata = setInterval(function(){ \
          document.querySelector('#mgr_gamedata').value = JSON.stringify(g_Minigame.CurrentScene().m_rgGameData); \
          document.querySelector('#mgr_playerdata').value = JSON.stringify(g_Minigame.m_CurrentScene.m_rgPlayerTechTree); \
        }," + config.wait.updatedata + "); \
      "; // provides access to game data without using unsafeWindow

      document.body.appendChild(_script);

      setTimeout(
        function(){
          ui.init(info.pane); // initialize UI
          data.update(data.state); // start polling for game data
        }
      ,config.wait.loaddata);
    },
    generate: function() {
      var _state = {
        level: '',
        lane: {
          1: {},
          2: {},
          3: {}
        },
        player: {}
      };

      [1,2,3].forEach(function(_lane){
        _state.lane[_lane].element = '';
        _state.lane[_lane].monsters = [];
        _state.lane[_lane].abilities = [];
        _state.lane[_lane].players = [];
      });

      return _state;
    },
    update: function(_state) {
      var _data = document.querySelector('#mgr_gamedata').value;

      if (!_data.length || _data === 'undefined')
        return; // sanity check
      else
        _data = JSON.parse(_data);

      _state = data.generate(); // blank slate

      _state.level = _data.level; // update current level

      var l_count = 0; // lane counter

      _data.lanes.forEach(function (_lane) {

        _state.lane[++l_count].element = info.enemy.element[_lane.element]; // update lane element, increment

        if (_lane.active_player_abilities.length > 0) {
          var _abilities = _lane.active_player_abilities;
          var alist = {};

          _abilities.forEach(function (_ability) {
            var aname = info.abilities[_ability.ability];
            
            if (!alist[aname])
              alist[aname] = [];

            alist[aname].push(_ability.accountid_caster);
          });

          for (var _ability in alist) {
            var _x = {
              name: _ability,
              casters: alist[_ability]
            };

            _state.lane[l_count].abilities.push(_x); // update current abilities
          }
        }

        _lane.enemies.forEach(function (_enemy) {
          var _x = {
            type: info.enemy.type[_enemy.type],
            id: _enemy.id,
            gold: _enemy.gold,
            // hp: _enemy.hp,
            hp_pct: (_enemy.hp/_enemy.max_hp)
          };

          _state.lane[l_count].monsters.push(_x); // update monsters
        });

        var p_count = 0; // player count in lane

        _lane.player_hp_buckets.forEach(function (_item) {
          p_count += _item;
        });

        _state.lane[l_count].players = p_count; // update player count

      });

      data.state = _state; // push data update

      setTimeout(
        function(){
          data.update(data.state);
          ui.update(ui.pane);
          // ui.generate(ui.data,data.state);
        }
      ,config.wait.updateui);

    }
  }

  data.state = data.generate();

  data.game.type = 'hidden';
  data.game.id = 'mgr_gamedata';
  
  data.player.type = 'hidden';
  data.player.id = 'mgr_playerdata';

  var ui = {
    pane: document.createElement('pre'),
    data: [
      // left margin
      // column 1: ['row','row','row','etc.'],
      // border
      // column 2: ['row','row','row','etc.'],
      // etc.
    ],
    init: function (_pane) {
      _pane.appendChild(ui.pane);
    },
    generate: function (_data, _state) {
      _data = []; // blank slate

      // generate one column at a time
      [1,2,3].forEach(function (_lane) {
        var _column = [];

        _column.push(ui.text.hr(40));

        // Header: Lane X - Element / # Players
        var _header = 'Lane ' + _lane + ' - ' + _state.lane[_lane].element + ' ; ' + _state.lane[_lane].players + ' players';
        _column.push(_header);

        _column.push(ui.text.hr(40));

        // Monsters
        _column.push('Monsters');
        var _column_gold = 0;
        // var _column_hp = 0;

          // Monster Type (ID) / % HP
          _state.lane[_lane].monsters.forEach(function (_monster) {
            var _x = '  ' + _monster.type + ' (' + _monster.id + ') ; ' + ~~(_monster.hp_pct * 100) + '% HP';
            _column_gold += _monster.gold;
            // _column_hp += _monster.hp;
            _column.push(_x);
          });

          // Total Monster HP (right-aligned)
          // _column.push(' ; ' + ~~(_column_hp) + ' total HP'); // overflows at 2^53 == 9 007 199 254 740 992

          // Total Monster Gold (right-aligned)
          _column.push(' ; ' + _column_gold +' total gold');

        _column.push(ui.text.hr(40));

        // Abilities
        _column.push('Abilities');

          // Ability Name / x#Stacked
          if (_state.lane[_lane].abilities.length > 0) {
            _state.lane[_lane].abilities.forEach(function (_ability) {
              var _x = '  ' + _ability.name + ' ; x' + _ability.casters.length;
              _column.push(_x); 
            });
          } else {
            _column.push('  (none)');
          }
            
        _column.push(ui.text.hr(40));
    
        _data.push(_column);
      });

      // equalize number of rows across columns
      var _colrows = [];
      _data.forEach(function (_column) {
        _colrows.push(_column.length);
      });

      var _maxrows = Math.max.apply(Math,_colrows);
      _data.forEach(function (_column) {
        for (var i = _maxrows - _column.length; i > 0; i--)
          _column.push(' ');
      })

      // generate output
      var _output = [];

      _data.forEach(function (_column) {
        var _index = 0;
        _column.forEach(function (_row) {
          if (_output[_index])
            _output[_index] += ' ' + ui.text.justify(_row,40) + ' |'; // subsequent columns
          else
            _output.push('| ' + ui.text.justify(_row,40) + ' |'); // first column
          _index++;
        });
      });

      // console.log(_output.join('\n'));
      return _output.join('\n');

    },
    update: function (_pane) {
      // remove children
      while (_pane.firstChild)
        _pane.removeChild(_pane.firstChild)

      var _text = document.createTextNode(ui.generate(ui.data,data.state));
      _pane.appendChild(_text);
    },
    text: {
      hr: function (_length) { // horizontal rule
        return new Array(_length+1).join('-');
      },
      justify: function (_text,_width) {
        var _x = _text.split(';');

        if (_x.length === 2) { // justify
          var _spacing = _width - _x[0].length - _x[1].length;
          _spacing = new Array(_spacing+1).join(' ');

          return '' + _x[0] + _spacing + _x[1];
        } else { // just pad the text
          var _spacing = _width - _x[0].length;
          _spacing = new Array(_spacing+1).join(' ');

          return '' + _x[0] + _spacing;
        }

      }
    }
  };

  info.init(info.pane);

})();