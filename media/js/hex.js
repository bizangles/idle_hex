// Generated by CoffeeScript 1.10.0
(function() {
  var hex, sin_60;

  hex = {};

  hex.Shape = (function() {
    function Shape() {
      this.x = 0;
      this.y = 0;
      this.line_width = 1;
      this.rotate = 0;
      this.rotation_speed = 0;
    }

    Shape.prototype.draw_init = function(ctx) {
      ctx.translate(this.x, this.y);
      ctx.lineWidth = this.line_width;
      return ctx.rotate(this.rotate * 2 * Math.PI);
    };

    Shape.prototype.animate = function(time_elapsed) {
      this.rotate += time_elapsed * this.rotation_speed;
      return this.rotate -= Math.floor(this.rotate);
    };

    Shape.prototype.draw = function(ctx) {
      ctx.save();
      this.draw_init(ctx);
      this.draw_shape(ctx);
      return ctx.restore();
    };

    Shape.prototype.draw_shape = function(ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = "Grey";
      ctx.fill();
      ctx.restore();
    };

    Shape.prototype.move = function(x, y) {
      this.x += x;
      return this.y += y;
    };

    Shape.prototype.move_to = function(x, y) {
      this.x = x;
      return this.y = y;
    };

    return Shape;

  })();

  hex.HexCell = (function() {
    function HexCell(hex_size) {
      this.shape = new hex.Shape();
      this.shape.scale = hex_size;
      this.shape.rotation_speed = 1 / 10;
    }

    HexCell.prototype.draw = function(ctx) {
      return this.shape.draw(ctx);
    };

    return HexCell;

  })();

  sin_60 = Math.sin(Math.PI / 3);

  hex.HexGrid = (function() {
    function HexGrid(canvas_id) {
      this.canvas_id = canvas_id;
      this.hex_size = 30;
      this.hex_gap = 3;
      this.blank_cell = new hex.HexCell(this.hex_size);
      this.scale = 1;
      this.objects = {};
      this.hex_level_shift = (this.hex_size * 1.5) + (this.hex_gap * sin_60);
      this.hex_side_shift = (this.hex_size * sin_60) + this.hex_gap / 2;
      this.last_time = 0;
      this.$canvas = $(this.canvas_id);
      this.canvas = this.$canvas[0];
      this.ctx = this.canvas.getContext('2d');
      this.engine = new engine.Engine(this);
      this.$canvas.on("mousewheel", (function(_this) {
        return function(e) {
          return _this.record_zoom(e);
        };
      })(this));
      this.zoom_change = 0;
      this.dragging = false;
      this.$canvas.mousedown((function(_this) {
        return function(e) {
          return _this.mousedown(e);
        };
      })(this)).mouseup((function(_this) {
        return function(e) {
          return _this.mouseup(e);
        };
      })(this)).mousemove((function(_this) {
        return function(e) {
          return _this.mousemove(e);
        };
      })(this));
      this.center = [0, 0];
      this.zoom_xy = [0, 0];
      this.anim_count = 0;
      this.total_anim_time = 0;
      this.cache_canvas = null;
      this.cache_scale = -1;
      this.temp_hex = new logic.Blank();
      this.temp_hex_loc = null;
      this.scale_change = 0;
      this.resize = false;
      $(window).resize((function(_this) {
        return function() {
          return _this.resize = true;
        };
      })(this));
      this.state = "stopped";
    }

    HexGrid.prototype.record_zoom = function(event) {
      this.zoom_xy = [event.pageX, event.pageY];
      this.scale_change += event.deltaY;
      return false;
    };

    HexGrid.prototype.do_zoom = function() {
      var old_scale, this_scale_change;
      if (this.scale_change !== 0) {
        this_scale_change = Math.ceil(this.scale_change / 3);
        if (Math.abs(this_scale_change) - Math.abs(this.scale_change) < 0) {
          this_scale_change = this.scale_change;
        }
        this.scale_change -= this_scale_change;
        old_scale = this.scale;
        this.scale = Math.exp(Math.log(this.scale) + this_scale_change / 100);
        if (this.scale < .5) {
          this.scale = .5;
        }
        if (this.scale > 10) {
          this.scale = 10;
        }
        this.center[0] = ((this.canvas.width / 2 - this.zoom_xy[0] + this.center[0]) * this.scale / old_scale) - this.canvas.width / 2 + this.zoom_xy[0];
        return this.center[1] = ((this.canvas.height / 2 - this.zoom_xy[1] + this.center[1]) * this.scale / old_scale) - this.canvas.height / 2 + this.zoom_xy[1];
      }
    };

    HexGrid.prototype.mousedown = function(e) {
      var c_x, c_y, closest_pos, ref;
      ref = this.get_closest_cell(e.pageX, e.pageY), c_x = ref[0], c_y = ref[1];
      closest_pos = c_x + "," + c_y;
      if (closest_pos in this.objects) {
        this.objects[closest_pos].mousedown(e);
        return this.clicking = this.objects[closest_pos];
      } else {
        return this.enable_drag(e);
      }
    };

    HexGrid.prototype.mousemove = function(e) {
      var obj, pos, ref;
      if (this.clicking != null) {
        ref = this.objects;
        for (pos in ref) {
          obj = ref[pos];
          if (obj === this.clicking) {
            delete this.objects[pos];
            break;
          }
        }
        this.clicking.mousemove(e, this);
        return this.clicking = null;
      } else {
        return this.drag(e);
      }
    };

    HexGrid.prototype.mouseup = function(e) {
      if (this.clicking != null) {
        this.clicking.click(e);
        this.clicking = null;
      }
      if (this.dragging && this.dragging !== true) {
        this.dragging.mouseup(e);
      }
      return this.disable_drag(e);
    };

    HexGrid.prototype.move = function(move_obj, x, y) {
      var new_pos, obj, pos, ref;
      ref = this.objects;
      for (pos in ref) {
        obj = ref[pos];
        if (obj === move_obj) {
          new_pos = x + "," + y;
          if (pos !== new_pos && !(new_pos in this.objects)) {
            delete this.objects[pos];
            this.objects[new_pos] = obj;
          }
          return;
        }
      }
    };

    HexGrid.prototype.move_temp_hex = function(pageX, pageY) {
      var ref, temp_pos, x, y;
      ref = this.get_closest_cell(pageX, pageY), x = ref[0], y = ref[1];
      temp_pos = x + "," + y;
      if (!(temp_pos in this.objects)) {
        return this.temp_hex_pos = [x, y];
      }
    };

    HexGrid.prototype.drop = function(obj) {
      this.add(obj, this.temp_hex_pos[0], this.temp_hex_pos[1]);
      return this.temp_hex_pos = null;
    };

    HexGrid.prototype.dragged = false;

    HexGrid.prototype.dragging = false;

    HexGrid.prototype.last_drag_pos = null;

    HexGrid.prototype.enable_drag = function(e) {
      this.dragging = true;
      return this.last_drag_pos = [e.pageX, e.pageY];
    };

    HexGrid.prototype.disable_drag = function() {
      this.dragging = false;
      return this.last_drag_pos = null;
    };

    HexGrid.prototype.drag = function(e) {
      var x_mov, y_mov;
      if (this.dragging === true) {
        x_mov = e.pageX - this.last_drag_pos[0];
        y_mov = e.pageY - this.last_drag_pos[1];
        this.last_drag_pos = [e.pageX, e.pageY];
        return this.center = [this.center[0] + x_mov, this.center[1] + y_mov];
      }
    };

    HexGrid.prototype.get_closest_cell = function(pageX, pageY) {
      var a_dis, a_odd_y, a_x, a_y, coord_x, coord_y, curr_dis, i, mouse_x, mouse_y, odd_y, pos, ref, round_x, round_y, shift_x, shift_y;
      mouse_x = pageX - (this.canvas.width / 2) - this.center[0];
      mouse_y = pageY - (this.canvas.height / 2) - this.center[1];
      shift_y = this.hex_level_shift * this.scale;
      shift_x = this.hex_side_shift * this.scale * 2;
      coord_y = Math.round(mouse_y / shift_y);
      odd_y = (Math.abs(coord_y) % 2) / 2;
      coord_x = Math.round((mouse_x / shift_x) - odd_y);
      round_x = (coord_x + odd_y) * shift_x;
      round_y = coord_y * shift_y;
      curr_dis = Math.pow(mouse_x - round_x, 2) + Math.pow(mouse_y - round_y, 2);
      for (pos = i = 0; i <= 5; pos = ++i) {
        ref = this.get_adjacent_xy(coord_x, coord_y, pos), a_x = ref[0], a_y = ref[1];
        a_odd_y = (Math.abs(a_y) % 2) / 2;
        a_dis = Math.pow(mouse_x - (a_x + a_odd_y) * shift_x, 2) + Math.pow(mouse_y - a_y * shift_y, 2);
        if (a_dis < curr_dis) {
          coord_x = a_x;
          coord_y = a_y;
          odd_y = a_odd_y;
          curr_dis = a_dis;
        }
      }
      return [coord_x, coord_y];
    };

    HexGrid.prototype.draw = function(ctx) {
      var b_shift_x, b_shift_y, c_height, c_scale, c_width, i, j, mod_height, mod_width, now, o, obj, objs, p, pos, ref, ref1, ref2, ref3, ref4, ref5, temp_pos, tmpctx, vhigh, vwide, x, y;
      ctx.save();
      c_width = this.canvas.width;
      c_height = this.canvas.height;
      now = new Date().getTime();
      mod_width = this.hex_side_shift * this.scale * 2;
      mod_height = this.hex_level_shift * this.scale * 2;
      if (this.cache_canvas === null || ((this.scale !== this.cache_scale || this.resize) && (now - this.last_cache) > 100)) {
        this.resize = false;
        this.last_cache = now;
        vwide = Math.ceil(c_width / (3 * this.scale * this.hex_side_shift));
        vhigh = Math.ceil(c_height / (3 * this.scale * this.hex_level_shift) * 2);
        this.cache_canvas = document.createElement('canvas');
        this.cache_canvas.width = mod_width * (vwide + 1) * 2;
        this.cache_canvas.height = mod_height * (vhigh + 2);
        tmpctx = this.cache_canvas.getContext('2d');
        tmpctx.translate(this.cache_canvas.width / 2, this.cache_canvas.height / 2);
        tmpctx.scale(this.scale, this.scale);
        for (x = i = ref = -1 * vwide, ref1 = vwide; ref <= ref1 ? i <= ref1 : i >= ref1; x = ref <= ref1 ? ++i : --i) {
          for (y = j = ref2 = -1 * vhigh - 1, ref3 = vhigh; ref2 <= ref3 ? j <= ref3 : j >= ref3; y = ref2 <= ref3 ? ++j : --j) {
            tmpctx.save();
            tmpctx.translate(this.hex_side_shift * ((x * 2) + Math.abs(y % 2)), this.hex_level_shift * y);
            this.blank_cell.draw(tmpctx);
            tmpctx.restore();
          }
        }
        this.cache_scale = this.scale;
      }
      c_scale = this.scale / this.cache_scale;
      b_shift_x = (this.cache_canvas.width / -2) + ((Math.floor(this.canvas.width / (2 * mod_width)) * mod_width + this.center[0]) % mod_width) / c_scale;
      b_shift_y = (this.cache_canvas.height / -2) + ((Math.floor(this.canvas.height / (2 * mod_height)) * mod_height + this.center[1]) % mod_height) / c_scale;
      ctx.save();
      ctx.scale(c_scale, c_scale);
      ctx.drawImage(this.cache_canvas, b_shift_x, b_shift_y);
      ctx.restore();
      ctx.translate(this.center[0], this.center[1]);
      ctx.scale(this.scale, this.scale);
      objs = {};
      ref4 = this.objects;
      for (p in ref4) {
        o = ref4[p];
        objs[p] = o;
      }
      if (this.temp_hex_pos != null) {
        temp_pos = this.temp_hex_pos[0] + "," + this.temp_hex_pos[1];
        objs[temp_pos] = this.temp_hex;
      }
      for (pos in objs) {
        obj = objs[pos];
        ref5 = pos.split(','), x = ref5[0], y = ref5[1];
        x = parseInt(x);
        y = parseInt(y);
        ctx.save();
        ctx.translate(this.hex_side_shift * ((x * 2) + Math.abs(y % 2)), this.hex_level_shift * y);
        obj.draw(ctx);
        ctx.restore();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(ctx.canvas.width / -2, ctx.canvas.height / -2);
      ctx.fillText("FPS: " + (this.anim_count / (this.total_anim_time / 1000)).toFixed(2), 10, 25);
      ctx.restore();

      /*
      if @mouse_x?
          ctx.save()
          ctx.translate(@center[0], @center[1])
          #ctx.translate(@mouse_x, @mouse_y)
          ctx.beginPath()
          ctx.moveTo(@mouse_x, @mouse_y)
          ctx.lineTo(@c_x, @c_y)
          ctx.stroke()
          ctx.restore()
       */
      return this.engine.draw(ctx);
    };

    HexGrid.prototype.add = function(obj, x, y) {
      var pos;
      pos = x + ',' + y;
      return this.objects[pos] = obj;
    };

    HexGrid.prototype["import"] = function(objects) {
      var args, i, len, obj, obj_desc, results, type, x, y;
      this.objects = {};
      results = [];
      for (i = 0, len = objects.length; i < len; i++) {
        obj_desc = objects[i];
        type = obj_desc[0];
        x = obj_desc[1];
        y = obj_desc[2];
        args = obj_desc.slice(3);
        obj = new logic[type]();
        obj.constructor.apply(obj, args);
        results.push(this.add(obj, x, y));
      }
      return results;
    };

    HexGrid.prototype["export"] = function() {
      var args, obj, pos, ref, ref1, results, type, x, y;
      ref = this.objects;
      results = [];
      for (pos in ref) {
        obj = ref[pos];
        console.log(obj);
        type = obj.constructor.name;
        ref1 = pos.split(','), x = ref1[0], y = ref1[1];
        x = parseInt(x);
        y = parseInt(y);
        args = obj.get_args();
        results.push([type, x, y].concat(args));
      }
      return results;
    };

    HexGrid.prototype.setup_menu = function(menu_id) {
      var _o, i, len, menu, menu_obj, obj, obj_canv, obj_div, objs, ref, type;
      menu = {
        base: [new logic.Wire([[4, 1], [], []]), new logic.Delay(4, 1)],
        gates: [new logic.And(3, 5, 1), new logic.Nor(3, 5, 1), new logic.Nand(3, 5, 1)],
        input: [new logic.Pulse(10), new logic.Switch()],
        output: [new logic.LED()]
      };
      menu_obj = $(menu_id);
      for (type in menu) {
        objs = menu[type];
        obj_div = $('<div>');
        for (i = 0, len = objs.length; i < len; i++) {
          obj = objs[i];
          ref = obj.put_on_temp_canv(), obj_canv = ref[0], _o = ref[1];
          obj.copy_on_drag = true;
          obj_div.append($("<div>").append(obj_canv));
        }
        menu_obj.append($("<h3>" + type + "</h3>"));
        menu_obj.append(obj_div);
      }
      menu_obj.accordion({
        heightStyle: "fill"
      });
      return $(window).resize((function(_this) {
        return function() {
          return menu_obj.accordion("refresh");
        };
      })(this));
    };

    HexGrid.prototype.iter_obj = function() {
      var iter, pos, x, xy, y;
      iter = [];
      for (pos in this.objects) {
        xy = pos.split(',');
        x = parseInt(xy[0]);
        y = parseInt(xy[1]);
        iter.push([x, y, this.objects[pos]]);
      }
      return iter;
    };

    HexGrid.prototype._requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(cb) {
      return window.setTimeout(cb, 1000 / 60);
    };

    HexGrid.prototype.requestAnimFrame = function(cb) {
      return this._requestAnimFrame.call(window, cb);
    };

    HexGrid.prototype.animate = function() {
      var this_time, time_elapsed;
      this_time = new Date().getTime();
      if (this.last_time) {
        if (this.anim_count === 100) {
          this.total_anim_time -= this.total_anim_time / 100;
          this.anim_count--;
        }
        this.total_anim_time += this_time - this.last_time;
        this.anim_count++;
      }
      time_elapsed = this.last_time === 0 ? 0 : (this_time - this.last_time) / 1000;
      this.last_time = this_time;
      this.do_zoom();
      this.canvas.width = this.$canvas.width();
      this.canvas.height = this.$canvas.height();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.draw(this.ctx);
      this.ctx.restore();
      return this.requestAnimFrame((function(_this) {
        return function() {
          return _this.animate();
        };
      })(this));
    };

    HexGrid.prototype.start = function() {
      this.play();
      return this.animate();
    };

    HexGrid.prototype.play = function() {
      var ref;
      if ((ref = this.state) === "stopped" || ref === "paused") {
        this.state = "running";
        return this.engine.start();
      }
    };

    HexGrid.prototype.pause = function() {
      if (this.state === "running") {
        this.state = "paused";
        return this.engine.pause();
      }
    };

    HexGrid.prototype.stop = function() {
      var ref;
      if ((ref = this.state) === "running" || ref === "paused") {
        this.state = "stopped";
        return this.engine.stop();
      }
    };

    HexGrid.prototype.restart = function() {
      this.stop();
      return this.play();
    };

    HexGrid.prototype.get_adjacent_xy = function(x, y, dir) {
      if (dir === 2 || dir === 3 || dir === 5 || dir === 0) {
        x += (dir + 1) % 2 - Math.abs(y + 1) % 2;
      }
      if (dir === 5 || dir === 0) {
        y -= 1;
      }
      if (dir === 2 || dir === 3) {
        y += 1;
      }
      if (dir === 4) {
        x -= 1;
      }
      if (dir === 1) {
        x += 1;
      }
      return [x, y];
    };

    HexGrid.prototype.get_adjacent = function(x, y, dir) {
      var a_x, a_y, pos, ref;
      ref = this.get_adjacent_xy(x, y, dir), a_x = ref[0], a_y = ref[1];
      pos = a_x + "," + a_y;
      return [a_x, a_y, this.objects[pos]];
    };

    return HexGrid;

  })();

  window.hex = hex;

}).call(this);

//# sourceMappingURL=hex.js.map