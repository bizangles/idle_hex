// Generated by CoffeeScript 1.10.0
(function() {
  var logic,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  logic = {};

  logic.Base = (function() {
    function Base() {
      this.img_ctx = null;
      if (this.img_src != null) {
        this.img_loaded = false;
        this.img = document.createElement('img');
        this.img.onload = (function(_this) {
          return function() {
            _this.img_loaded = true;
            return _this.draw_img();
          };
        })(this);
        this.img.src = this.img_src;
      }
      this.copy_on_drag = false;
    }

    Base.prototype.draw = function(ctx) {
      this.draw_hex(ctx);
      this.draw_logic(ctx);
      return this.draw_name(ctx);
    };

    Base.prototype.draw_hex = function(ctx) {
      var i, j;
      ctx.save();
      ctx.lineWidth = 1 / 30;
      ctx.scale(30, 30);
      ctx.beginPath();
      ctx.moveTo(0, -1);
      for (i = j = 1; j <= 5; i = ++j) {
        ctx.rotate(Math.PI / 3);
        ctx.lineTo(0, -1);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = "White";
      ctx.fill();
      return ctx.restore();
    };

    Base.prototype.draw_logic = function(ctx) {};

    Base.prototype.draw_name = function(ctx) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.name, 0, 0);
      return ctx.restore();
    };

    Base.prototype.draw_img = function(ctx) {
      var img_height, img_width, ratio;
      if (!this.img_loaded) {
        this.img_ctx = ctx;
        return;
      }
      if (this.img_loaded && (this.img_ctx != null)) {
        ctx = this.img_ctx;
        this.img_ctx = null;
      }
      if (this.img_loaded && (ctx != null)) {
        ratio = this.img.height / this.img.width;
        img_height = 15;
        img_width = img_height / ratio;
        return ctx.drawImage(this.img, img_width / -2, img_height / -2, img_width, img_height);
      }
    };

    Base.prototype.tick = function() {};

    Base.prototype.flush = function() {
      return this.state = this.next_state;
    };

    Base.prototype.draw_lead = function(ctx, dir, color) {
      ctx.save();
      ctx.beginPath();
      ctx.rotate(Math.PI / 6);
      ctx.rotate(dir * Math.PI / 3);
      ctx.arc(0, -20, 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      return ctx.restore();
    };

    Base.prototype.draw_circle = function(ctx, size, color) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      return ctx.restore();
    };

    Base.prototype.is_powered = function() {
      return false;
    };

    Base.prototype.mousedown = function(e) {
      this.clicking = true;
      this.last_drag_pos = [e.pageX, e.pageY];
      return false;
    };

    Base.prototype.mousemove = function(e) {
      var copy, dragging, obj, ref, t_canv;
      t_canv = this.t_canv;
      dragging = this.dragging;
      if (this.clicking && !this.dragging) {
        this.clicking = false;
        ref = this.put_on_temp_canv(copy = this.copy_on_drag), t_canv = ref[0], obj = ref[1];
        obj.dragging = dragging = true;
        t_canv.className = "dragging";
        $("#dragging_space").append(t_canv).width('100%').height('100%').mousemove((function(_this) {
          return function(e) {
            return obj.mousemove(e);
          };
        })(this));
      }
      if (dragging === true) {
        $(t_canv).css('top', e.pageY - t_canv.height / 2);
        $(t_canv).css('left', e.pageX - t_canv.width / 2);
        return grid.move_temp_hex(e.pageX, e.pageY);
      }
    };

    Base.prototype.mouseup = function(e) {
      this.clicking = false;
      if (this.dragging) {
        $(this.t_canv).remove();
        this.t_canv = null;
        this.dragging = false;
        $("#dragging_space").width('0px').height('0px').unbind('mousemove');
        grid.drop(this);
      }
      return this.last_drag_pos = null;
    };

    Base.prototype.click = function(e) {
      var buttons;
      $("#config").html('');
      this.config($("#config"));
      buttons = $("#config").dialog("option", "buttons");
      buttons[0].click = (function(_this) {
        return function() {
          return _this.config_save_wrap($("#config"));
        };
      })(this);
      $("#config").dialog("option", "buttons", buttons);
      return $("#config").dialog("open");
    };

    Base.prototype.config_save_wrap = function(jq_obj) {
      this.config_save(jq_obj);
      return jq_obj.dialog("close");
    };

    Base.prototype.config = function(jq_obj) {};

    Base.prototype.config_save = function(jq_obj) {};

    Base.prototype.put_on_temp_canv = function(copy) {
      var obj, t_canv, t_ctx;
      if (copy == null) {
        copy = false;
      }
      if (copy) {
        obj = this.copy();
      } else {
        obj = this;
      }
      t_canv = document.createElement('canvas');
      t_canv.width = 70;
      t_canv.height = 70;
      t_ctx = t_canv.getContext('2d');
      t_ctx.translate(35, 35);
      obj.t_canv = t_canv;
      $(t_canv).mousedown((function(_this) {
        return function(e) {
          return obj.mousedown(e);
        };
      })(this)).mouseup((function(_this) {
        return function(e) {
          return obj.mouseup(e);
        };
      })(this)).mousemove((function(_this) {
        return function(e) {
          return obj.mousemove(e);
        };
      })(this));
      obj.draw(t_ctx);
      return [t_canv, obj];
    };

    Base.prototype.get_args = function() {
      return [];
    };

    Base.prototype.copy = function() {
      var obj, type;
      type = this.constructor.name;
      obj = new logic[type]();
      obj.constructor.apply(obj, this.get_args());
      return obj;
    };

    Base.prototype.get_dropdown = function() {
      var dropdown, i, j;
      dropdown = $("<select>");
      for (i = j = 0; j <= 5; i = ++j) {
        dropdown.append("<option>" + i + "</option>");
      }
      return dropdown;
    };

    Base.prototype.reset = function() {};

    return Base;

  })();

  logic.Blank = (function(superClass) {
    extend(Blank, superClass);

    function Blank() {
      return Blank.__super__.constructor.apply(this, arguments);
    }

    Blank.prototype.name = "";

    Blank.prototype.draw_logic = function() {};

    return Blank;

  })(logic.Base);

  logic.Heat_Source = (function(superClass) {
    extend(Heat_Source, superClass);

    Heat_Source.prototype.name = "source";

    Heat_Source.prototype.takes_heat = false;

    function Heat_Source(heat1) {
      this.heat = heat1;
      this.next_state = this.state = {
        heat: this.heat
      };
      Heat_Source.__super__.constructor.apply(this, arguments);
    }

    Heat_Source.prototype.get_args = function() {
      return [this.heat];
    };

    Heat_Source.prototype.tick = function(x, y, grid) {
      var a_x, a_y, adj, all_adjacent, j, k, len, len1, ref, ref1, results, take, take_amt, take_ratio, takes_heat, total_take;
      all_adjacent = grid.get_all_adjacent(x, y);
      takes_heat = [];
      total_take = 0;
      for (j = 0, len = all_adjacent.length; j < len; j++) {
        ref = all_adjacent[j], a_x = ref[0], a_y = ref[1], adj = ref[2];
        if ((adj != null) && adj.takes_heat && adj.state.heat < this.state.heat) {
          take = (this.state.heat - adj.state.heat) / 2;
          total_take += take;
          takes_heat.push([adj, take]);
        }
      }
      take_ratio = Math.min(1, this.state.heat / total_take);
      results = [];
      for (k = 0, len1 = takes_heat.length; k < len1; k++) {
        ref1 = takes_heat[k], adj = ref1[0], take = ref1[1];
        take_amt = take_ratio * take;
        results.push(this.give_heat(adj, take_amt));
      }
      return results;
    };

    Heat_Source.prototype.give_heat = function(to, heat) {
      return to.take_heat(heat);
    };

    return Heat_Source;

  })(logic.Base);

  logic.Heat_Sync = (function(superClass) {
    extend(Heat_Sync, superClass);

    Heat_Sync.prototype.name = "sync";

    Heat_Sync.prototype.takes_heat = true;

    function Heat_Sync(max_heat) {
      this.max_heat = max_heat;
      Heat_Sync.__super__.constructor.call(this, 0);
    }

    Heat_Sync.prototype.get_args = function() {
      return [this.max_heat];
    };

    Heat_Sync.prototype.give_heat = function(to, heat) {
      this.next_state = {
        heat: this.next_state.heat - heat
      };
      return Heat_Sync.__super__.give_heat.apply(this, arguments);
    };

    Heat_Sync.prototype.take_heat = function(heat) {
      return this.next_state = {
        heat: this.next_state.heat + heat
      };
    };

    Heat_Sync.prototype.draw_logic = function(ctx) {
      return this.draw_circle(ctx, Math.max(0, Math.min(this.state.heat / this.max_heat * 25, 25)), "#FDD");
    };

    return Heat_Sync;

  })(logic.Heat_Source);

  logic.Power_Gen = (function(superClass) {
    extend(Power_Gen, superClass);

    function Power_Gen() {
      return Power_Gen.__super__.constructor.apply(this, arguments);
    }

    Power_Gen.prototype.name = "gen";

    Power_Gen.prototype.take_heat = function(heat) {
      return this.next_state = {
        heat: this.next_state.heat + heat
      };
    };

    Power_Gen.prototype.flush = function() {
      this.next_state.heat = Math.max(0, this.next_state.heat - this.max_heat);
      return Power_Gen.__super__.flush.apply(this, arguments);
    };

    return Power_Gen;

  })(logic.Heat_Sync);

  logic.Binary_Gate = (function(superClass) {
    extend(Binary_Gate, superClass);

    function Binary_Gate(in11, in21, out1) {
      this.in1 = in11;
      this.in2 = in21;
      this.out = out1;
      this.next_state = this.state = {
        in1: false,
        in2: false,
        out: false
      };
      Binary_Gate.__super__.constructor.apply(this, arguments);
    }

    Binary_Gate.prototype.get_args = function() {
      return [this.in1, this.in2, this.out];
    };

    Binary_Gate.prototype.tick = function(x, y, grid) {
      var a1, a1_x, a1_y, a2, a2_x, a2_y, in1, in2, out, ref, ref1;
      ref = grid.get_adjacent(x, y, this.in1), a1_x = ref[0], a1_y = ref[1], a1 = ref[2];
      ref1 = grid.get_adjacent(x, y, this.in2), a2_x = ref1[0], a2_y = ref1[1], a2 = ref1[2];
      in1 = (a1 != null) && a1.is_powered((this.in1 + 3) % 6);
      in2 = (a2 != null) && a2.is_powered((this.in2 + 3) % 6);
      out = this.tick_logic(in1, in2);
      return this.next_state = {
        in1: in1,
        in2: in2,
        out: out
      };
    };

    Binary_Gate.prototype.draw_logic = function(ctx) {
      this.draw_img(ctx);
      this.draw_lead(ctx, this.in1, this.state.in1 ? "Green" : "Red");
      this.draw_lead(ctx, this.in2, this.state.in2 ? "Green" : "Red");
      return this.draw_lead(ctx, this.out, this.state.out ? "Green" : "Red");
    };

    Binary_Gate.prototype.draw_name = function() {};

    Binary_Gate.prototype.is_powered = function(dir) {
      if (dir === this.out) {
        return this.state.out;
      }
      return false;
    };

    Binary_Gate.prototype.config = function(jq_obj) {
      jq_obj.append(this.get_dropdown().val(this.in1));
      jq_obj.append(this.get_dropdown().val(this.in2));
      return jq_obj.append(this.get_dropdown().val(this.out));
    };

    Binary_Gate.prototype.config_save = function(jq_obj) {
      var vals;
      vals = [];
      jq_obj.find("select").each(function(i, o) {
        return vals.push(parseInt(o.value));
      });
      return this.in1 = vals[0], this.in2 = vals[1], this.out = vals[2], vals;
    };

    return Binary_Gate;

  })(logic.Base);

  logic.And = (function(superClass) {
    extend(And, superClass);

    function And() {
      return And.__super__.constructor.apply(this, arguments);
    }

    And.prototype.name = "and";

    And.prototype.img_src = "media/img/AND_ANSI.svg";

    And.prototype.tick_logic = function(in1, in2) {
      return in1 && in2;
    };

    return And;

  })(logic.Binary_Gate);

  logic.Nor = (function(superClass) {
    extend(Nor, superClass);

    function Nor() {
      return Nor.__super__.constructor.apply(this, arguments);
    }

    Nor.prototype.name = "and";

    Nor.prototype.img_src = "media/img/NOR_ANSI.svg";

    Nor.prototype.tick_logic = function(in1, in2) {
      return !(in1 || in2);
    };

    return Nor;

  })(logic.Binary_Gate);

  logic.Nand = (function(superClass) {
    extend(Nand, superClass);

    function Nand() {
      return Nand.__super__.constructor.apply(this, arguments);
    }

    Nand.prototype.name = "and";

    Nand.prototype.img_src = "media/img/NAND_ANSI.svg";

    Nand.prototype.tick_logic = function(in1, in2) {
      return !(in1 && in2);
    };

    return Nand;

  })(logic.Binary_Gate);

  logic.Pulse = (function(superClass) {
    extend(Pulse, superClass);

    Pulse.prototype.name = "pulse";

    function Pulse(rate) {
      this.rate = rate;
      this.reset();
    }

    Pulse.prototype.reset = function() {
      this.ticks_left = this.rate;
      return this.next_state = this.state = {
        power: false
      };
    };

    Pulse.prototype.get_args = function() {
      return [this.rate];
    };

    Pulse.prototype.tick = function() {
      this.ticks_left--;
      if (this.ticks_left <= 0) {
        this.next_state = {
          power: !this.state.power
        };
        return this.ticks_left = this.rate;
      }
    };

    Pulse.prototype.draw_logic = function(ctx) {
      if (this.state.power) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.fillStyle = "FDD";
        ctx.fill();
        return ctx.restore();
      }
    };

    Pulse.prototype.is_powered = function(dir) {
      return this.state.power;
    };

    Pulse.prototype.config = function(jq_obj) {
      return jq_obj.append("<input value=\"" + this.rate + "\">");
    };

    Pulse.prototype.config_save = function(jq_obj) {
      return this.rate = jq_obj.find("input").val();
    };

    return Pulse;

  })(logic.Base);

  logic.LED = (function(superClass) {
    extend(LED, superClass);

    LED.prototype.name = "led";

    function LED() {
      this.next_state = this.state = {
        power: false
      };
    }

    LED.prototype.draw_logic = function(ctx) {
      if (this.state.power) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, 2 * Math.PI);
        ctx.fillStyle = "FDD";
        ctx.fill();
        return ctx.restore();
      }
    };

    LED.prototype.tick = function(x, y, grid) {
      var a, a_x, a_y, j, l, powered, ref;
      powered = false;
      for (l = j = 0; j <= 5; l = ++j) {
        ref = grid.get_adjacent(x, y, l), a_x = ref[0], a_y = ref[1], a = ref[2];
        if ((a != null) && a.is_powered((l + 3) % 6)) {
          powered = true;
          break;
        }
      }
      return this.next_state = {
        power: powered
      };
    };

    return LED;

  })(logic.Base);

  logic.Wire = (function(superClass) {
    extend(Wire, superClass);

    Wire.prototype.name = "wire";

    Wire.prototype.instant = true;

    function Wire(wires1) {
      this.wires = wires1;
      this.updated = [false, false, false];
      this.state = {
        power: [false, false, false]
      };
    }

    Wire.prototype.get_args = function() {
      return [this.wires];
    };

    Wire.prototype.config = function(jq_obj) {
      var i, j, k, len, ref, results, wire, wire_div;
      ref = this.wires;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        wire = ref[j];
        wire_div = $("<div>");
        for (i = k = 0; k <= 5; i = ++k) {
          wire_div.append($("<input label=\"" + i + "\" type=\"checkbox\"" + (indexOf.call(wire, i) >= 0 ? " checked" : "") + ">"));
        }
        results.push(jq_obj.append(wire_div));
      }
      return results;
    };

    Wire.prototype.config_save = function(jq_obj) {
      var wires;
      wires = [];
      jq_obj.find("div").each((function(_this) {
        return function(w, wire_div) {
          var wire;
          wire = [];
          $(wire_div).find("input[type=checkbox]").each(function(i, inp) {
            if (inp.checked) {
              return wire.push(i);
            }
          });
          return wires.push(wire);
        };
      })(this));
      return this.wires = wires;
    };

    Wire.prototype.tick = function(x, y, grid) {
      var a, a_x, a_y, delayed, j, k, l, len, ref, results, w, wire;
      results = [];
      for (w = j = 0; j <= 2; w = ++j) {
        if (this.updated[w]) {
          continue;
        }
        wire = this.wires[w];
        this.updated[w] = true;
        this.state.power[w] = false;
        delayed = [];
        for (k = 0, len = wire.length; k < len; k++) {
          l = wire[k];
          ref = grid.get_adjacent(x, y, l), a_x = ref[0], a_y = ref[1], a = ref[2];
          if (a != null) {
            if (a.instant && !a.is_updated((l + 3) % 6)) {
              delayed.push([l, a_x, a_y, a]);
              continue;
            }
            if (a.is_powered((l + 3) % 6)) {
              this.state.power[w] = true;
              break;
            }
          }
        }
        results.push((function() {
          var len1, m, ref1, results1;
          results1 = [];
          for (m = 0, len1 = delayed.length; m < len1; m++) {
            ref1 = delayed[m], l = ref1[0], a_x = ref1[1], a_y = ref1[2], a = ref1[3];
            a.tick(a_x, a_y, grid);
            if (a.is_powered((l + 3) % 6)) {
              results1.push(this.state.power[w] = true);
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    Wire.prototype.flush = function() {
      return this.updated = [false, false, false];
    };

    Wire.prototype.is_updated = function(dir) {
      var j, w, wire;
      if (dir == null) {
        return !(indexOf.call(this.updated, false) >= 0);
      }
      for (w = j = 0; j <= 2; w = ++j) {
        wire = this.wires[w];
        if (indexOf.call(wire, dir) >= 0) {
          return this.updated[w];
        }
      }
    };

    Wire.prototype.is_powered = function(dir) {
      var j, w, wire;
      for (w = j = 0; j <= 2; w = ++j) {
        wire = this.wires[w];
        if (indexOf.call(wire, dir) >= 0) {
          return this.state.power[w];
        }
      }
    };

    Wire.prototype.draw_logic = function(ctx) {
      var color, j, k, l, ref, results, w, wire;
      results = [];
      for (w = j = 0; j <= 2; w = ++j) {
        wire = this.wires[w];
        if (wire.length === 0) {
          continue;
        }
        color = this.state.power[w] ? "Green" : "Red";
        ctx.save();
        ctx.beginPath();
        ctx.rotate(Math.PI / 6);
        ctx.moveTo(0, 0);
        for (l = k = 0, ref = wire.length - 1; 0 <= ref ? k <= ref : k >= ref; l = 0 <= ref ? ++k : --k) {
          ctx.save();
          ctx.rotate(wire[l] * Math.PI / 3);
          ctx.lineTo(0, -25);
          ctx.lineTo(0, 0);

          /*
          if l == 0
              ctx.moveTo(0,-25)
          else
              #ctx.bezierCurveTo(0,0,0,0,0,-25)
              ctx.quadraticCurveTo(0,0,0,-25)
           */
          ctx.restore();
        }
        ctx.lineWidth = 5;
        ctx.strokeStyle = "Black";
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.stroke();
        results.push(ctx.restore());
      }
      return results;
    };

    return Wire;

  })(logic.Base);

  logic.Delay = (function(superClass) {
    extend(Delay, superClass);

    Delay.prototype.name = "delay";

    function Delay(_in, out1) {
      this["in"] = _in;
      this.out = out1;
      this.next_state = this.state = {
        power: false
      };
    }

    Delay.prototype.get_args = function() {
      return [this["in"], this.out];
    };

    Delay.prototype.tick = function(x, y, grid) {
      var a, a_x, a_y, powered, ref;
      powered = false;
      ref = grid.get_adjacent(x, y, this["in"]), a_x = ref[0], a_y = ref[1], a = ref[2];
      if ((a != null) && a.is_powered((this["in"] + 3) % 6)) {
        powered = true;
      }
      return this.next_state = {
        power: powered
      };
    };

    Delay.prototype.is_powered = function(dir) {
      if (dir === this.out) {
        return this.state.power;
      }
      return false;
    };

    Delay.prototype.draw_logic = function(ctx) {
      this.draw_lead(ctx, this["in"], this.state.power ? "Green" : "Red");
      return this.draw_lead(ctx, this.out, this.state.power ? "Green" : "Red");
    };

    Delay.prototype.config = function(jq_obj) {
      jq_obj.append(this.get_dropdown().val(this["in"]));
      return jq_obj.append(this.get_dropdown().val(this.out));
    };

    Delay.prototype.config_save = function(jq_obj) {
      var vals;
      vals = [];
      jq_obj.find("select").each(function(i, o) {
        return vals.push(parseInt(o.value));
      });
      return this["in"] = vals[0], this.out = vals[1], vals;
    };

    return Delay;

  })(logic.Base);

  logic.Switch = (function(superClass) {
    extend(Switch, superClass);

    Switch.prototype.name = "switch";

    function Switch() {
      this.state = {
        power: false
      };
    }

    Switch.prototype.is_powered = function(dir) {
      return this.state.power;
    };

    Switch.prototype.draw_logic = function(ctx) {
      if (this.state.power) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.fillStyle = "FDD";
        ctx.fill();
        return ctx.restore();
      }
    };

    Switch.prototype.flush = function() {};

    Switch.prototype.click = function() {
      return this.state.power = !this.state.power;
    };

    return Switch;

  })(logic.Base);

  window.logic = logic;

}).call(this);

//# sourceMappingURL=logic.js.map
