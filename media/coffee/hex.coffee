hex = {}

class hex.Shape
    constructor: () ->
        @x = 0
        @y = 0
        @line_width = 1
        @rotate = 0
        @rotation_speed = 0

    draw_init: (ctx) ->
        ctx.translate @x, @y
        ctx.lineWidth = @line_width
        ctx.rotate @rotate * 2 * Math.PI

    animate: (time_elapsed) ->
        @rotate += time_elapsed * @rotation_speed
        @rotate -= Math.floor @rotate

    draw: (ctx) ->
        ctx.save();
        @draw_init ctx
        @draw_shape ctx
        ctx.restore()

    draw_shape: (ctx) ->
        ctx.save()
        ctx.beginPath()
        ctx.arc 0, 0, 2.5, 0, 2 * Math.PI
        ctx.fillStyle = "Grey"
        ctx.fill()
        ctx.restore()
        return

    move: (x, y) ->
        @x += x
        @y += y

    move_to: (x, y) ->
        @x = x
        @y = y

class hex.HexCell
    constructor: (hex_size) ->
        @shape = new hex.Shape()
        @shape.scale = hex_size
        @shape.rotation_speed = 1 / 10


    draw: (ctx) ->
        @shape.draw ctx

sin_60 = Math.sin(Math.PI / 3)

class hex.HexGrid
    constructor: (@canvas_id) ->
        @hex_size = 30
        @hex_gap = 3

        @blank_cell = new hex.HexCell @hex_size
        @scale = 1

        @objects = {}

        @hex_level_shift = (@hex_size * 1.5) + (@hex_gap * sin_60)
        @hex_side_shift = (@hex_size * sin_60) + @hex_gap / 2

        @last_time = 0

        @$canvas = $(@canvas_id)
        @canvas = @$canvas[0]
        @ctx = @canvas.getContext('2d')

        @engine = new engine.Engine(@)

        @$canvas.on "mousewheel", (e) =>
            @record_zoom e

        @zoom_change = 0

        @dragging = false
        @$canvas.mousedown((e) => @mousedown(e)
        ).mouseup((e) => @mouseup(e)
        ).mousemove((e) => @mousemove(e))

        @center = [0,0]
        @zoom_xy = [0,0]

        @anim_count = 0
        @total_anim_time = 0

        @cache_canvas = null
        @cache_scale = -1

        @temp_hex = new logic.Blank()
        @temp_hex_loc = null
        @scale_change = 0

        @resize = false
        $(window).resize () => @resize = true

        @state = "stopped"

    record_zoom: (event) ->
        @zoom_xy = [event.pageX, event.pageY]
        @scale_change += event.deltaY
        false

    do_zoom: () ->
        if @scale_change != 0
            this_scale_change = Math.ceil(@scale_change / 3)
            if Math.abs(this_scale_change) - Math.abs(@scale_change) < 0
                this_scale_change = @scale_change
            @scale_change -= this_scale_change
            old_scale = @scale
            @scale = Math.exp(Math.log(@scale) + this_scale_change/100)
            @scale = .5 if @scale < .5
            @scale = 10 if @scale > 10
            @center[0] = ((@canvas.width/2 - @zoom_xy[0] + @center[0]) * @scale / old_scale) - @canvas.width/2 + @zoom_xy[0]
            @center[1] = ((@canvas.height/2 - @zoom_xy[1] + @center[1]) * @scale / old_scale) - @canvas.height/2 + @zoom_xy[1]

    mousedown: (e) ->
        [c_x, c_y] = @get_closest_cell e.pageX, e.pageY
        closest_pos = "#{c_x},#{c_y}"
        if closest_pos of @objects
            @objects[closest_pos].mousedown e
            @clicking = @objects[closest_pos]
        else
            @enable_drag e

    mousemove: (e) ->
        #@get_closest_cell e.pageX, e.pageY
        if @clicking?
            for pos, obj of @objects
                if obj == @clicking
                    delete @objects[pos]
                    break
            @clicking.mousemove e, @
            @clicking = null
        else
            @drag e

    mouseup: (e) ->
        if @clicking?
            @clicking.click e
            @clicking = null
        if @dragging and @dragging != true
            @dragging.mouseup e
        @disable_drag e

    move: (move_obj, x, y) ->
        for pos, obj of @objects
            if obj == move_obj
                new_pos = "#{x},#{y}"
                if pos != new_pos and new_pos not of @objects
                    delete @objects[pos]
                    @objects[new_pos] = obj
                return

    move_temp_hex: (pageX, pageY) ->
        [x, y] = @get_closest_cell pageX, pageY
        temp_pos = "#{x},#{y}"
        if temp_pos not of @objects
            @temp_hex_pos = [x, y]

    drop: (obj) ->
        @add obj, @temp_hex_pos[0], @temp_hex_pos[1]
        @temp_hex_pos = null

    dragged: false
    dragging: false
    last_drag_pos: null
    enable_drag: (e) ->
        @dragging = true
        @last_drag_pos = [e.pageX, e.pageY]

    disable_drag: () ->
        @dragging = false
        @last_drag_pos = null

    drag: (e) ->
        if @dragging == true
            x_mov = e.pageX - @last_drag_pos[0]
            y_mov = e.pageY - @last_drag_pos[1]
            @last_drag_pos = [e.pageX, e.pageY]
            @center = [@center[0]+x_mov, @center[1]+y_mov]

    get_closest_cell: (pageX, pageY) ->
        mouse_x = pageX - (@canvas.width / 2) - @center[0]
        mouse_y = pageY - (@canvas.height / 2) - @center[1]

        shift_y = @hex_level_shift * @scale
        shift_x = @hex_side_shift * @scale * 2

        coord_y = Math.round(mouse_y / shift_y)
        odd_y = (Math.abs(coord_y) % 2) / 2
        coord_x = Math.round((mouse_x / shift_x) - odd_y)

        round_x = (coord_x + odd_y) * shift_x
        round_y = coord_y * shift_y

        curr_dis = Math.pow(mouse_x - round_x, 2) + Math.pow(mouse_y - round_y, 2)
        for pos in [0..5]
            [a_x, a_y] = @get_adjacent_xy coord_x, coord_y, pos
            a_odd_y = (Math.abs(a_y) % 2) / 2
            a_dis = Math.pow(mouse_x - (a_x + a_odd_y) * shift_x, 2) + Math.pow(mouse_y - a_y * shift_y, 2)
            if a_dis < curr_dis
                coord_x = a_x
                coord_y = a_y
                odd_y = a_odd_y
                curr_dis = a_dis
        #@c_x = (coord_x + odd_y) * shift_x
        #@c_y = coord_y * shift_y
        return [coord_x, coord_y]

    draw: (ctx) ->
        ctx.save()

        #c_width = 400 
        #c_height = 400
        c_width = @canvas.width
        c_height = @canvas.height
        now = new Date().getTime()
        mod_width = @hex_side_shift * @scale * 2
        mod_height = @hex_level_shift * @scale * 2

        if @cache_canvas == null or ((@scale != @cache_scale or @resize) and (now - @last_cache) > 100)
            @resize = false
            @last_cache = now
            vwide = Math.ceil(c_width / (3 * @scale * @hex_side_shift))
            vhigh = Math.ceil(c_height / (3 * @scale * @hex_level_shift) * 2)

            @cache_canvas = document.createElement('canvas')
            @cache_canvas.width = mod_width * (vwide + 1) * 2
            @cache_canvas.height = mod_height * (vhigh + 2)
            #c_width + @scale * @hex_side_shift * 2 
            #c_height + @scale * @hex_level_shift * 2

            tmpctx = @cache_canvas.getContext('2d')
            #tmpctx.strokeRect(0,0,@cache_canvas.width,@cache_canvas.height)
            tmpctx.translate(@cache_canvas.width/2, @cache_canvas.height/2)
            tmpctx.scale @scale, @scale

            #vwide = 5
            #vhigh = 5

            for x in [-1*vwide..vwide]
                for y in [-1*vhigh-1..vhigh]
                    tmpctx.save()
                    tmpctx.translate(
                        @hex_side_shift * ((x * 2) + Math.abs(y % 2)),
                        @hex_level_shift * y
                    )
                    @blank_cell.draw tmpctx
                    tmpctx.restore()
            @cache_scale = @scale

        c_scale = @scale / @cache_scale

        b_shift_x = (@cache_canvas.width / -2) + ((Math.floor(@canvas.width / (2 * mod_width)) * mod_width + @center[0]) % mod_width) / c_scale
        b_shift_y = (@cache_canvas.height / -2) + ((Math.floor(@canvas.height / (2 * mod_height)) * mod_height + @center[1]) % mod_height) / c_scale

        #b_shift_x = (c_width / -2) + (@center[0] - Math.floor(@center[0] / (@scale * @hex_side_shift * 2)) * @scale * @hex_side_shift * 2) - @hex_side_shift * 2 * @scale
        #b_shift_y = (c_height / -2) + (@center[1] - Math.floor(@center[1] / (@scale * @hex_level_shift * 2)) * @scale * @hex_level_shift * 2) - @hex_level_shift * 2 * @scale

        ctx.save()
        ctx.scale c_scale, c_scale
        ctx.drawImage(@cache_canvas, b_shift_x, b_shift_y)
        ctx.restore()

        ctx.translate(@center[0], @center[1])
        ctx.scale @scale, @scale

        objs = {}
        objs[p] = o for p, o of @objects
        if @temp_hex_pos?
            temp_pos = "#{@temp_hex_pos[0]},#{@temp_hex_pos[1]}"
            objs[temp_pos] = @temp_hex

        for pos, obj of objs
            [x, y] = pos.split ','
            x = parseInt x
            y = parseInt y
            ctx.save()
            ctx.translate(
                @hex_side_shift * ((x * 2) + Math.abs(y % 2)),
                @hex_level_shift * y
            )
            obj.draw ctx
            ctx.restore()
        ctx.restore()

        ctx.save()
        ctx.translate(ctx.canvas.width/-2, ctx.canvas.height/-2)
        ctx.fillText("FPS: " + (@anim_count/(@total_anim_time/1000)).toFixed(2), 10, 25)
        ctx.restore()

        ###
        if @mouse_x?
            ctx.save()
            ctx.translate(@center[0], @center[1])
            #ctx.translate(@mouse_x, @mouse_y)
            ctx.beginPath()
            ctx.moveTo(@mouse_x, @mouse_y)
            ctx.lineTo(@c_x, @c_y)
            ctx.stroke()
            ctx.restore()
        ###
        #ctx.strokeRect(@canvas.width/-4,@canvas.height/-4,@canvas.width/2,@canvas.height/2)
        @engine.draw ctx

    add: (obj, x, y) ->
        pos = x + ',' + y
        @objects[pos] = obj

    import: (objects) ->
        @objects = {}
        for obj_desc in objects
            type = obj_desc[0]
            x = obj_desc[1]
            y = obj_desc[2]
            args = obj_desc[3..]
            obj = new logic[type]()
            obj.constructor.apply(obj,args)
            @add(obj, x, y)

    export: () ->
        for pos, obj of @objects
            console.log obj
            type = obj.constructor.name
            [x, y] = pos.split(',')
            x = parseInt(x)
            y = parseInt(y)
            args = obj.get_args()
            [type, x, y].concat(args)

    setup_menu: (menu_id) ->
        menu =
            base: [
                new logic.Wire [[4, 1],[],[]]
                new logic.Delay 4, 1
            ]
            gates: [
                new logic.And 3, 5, 1
                new logic.Nor 3, 5, 1
                new logic.Nand 3, 5, 1
            ]
            input: [
                new logic.Pulse 10
                new logic.Switch()
            ]
            output: [
                new logic.LED()
            ]

        menu_obj = $(menu_id)

        for type, objs of menu
            obj_div = $('<div>')
            for obj in objs
                [obj_canv, _o] = obj.put_on_temp_canv()
                obj.copy_on_drag = true
                obj_div.append($("<div>").append(obj_canv))

            menu_obj.append $("<h3>#{type}</h3>")
            menu_obj.append obj_div

        menu_obj.accordion
            heightStyle: "fill"

        $(window).resize () => menu_obj.accordion "refresh"

    iter_obj: () ->
        iter = []
        for pos of @objects
            xy = pos.split(',')
            x = parseInt(xy[0])
            y = parseInt(xy[1])
            iter.push([x, y, @objects[pos]])
        return iter

    _requestAnimFrame:
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (cb) -> window.setTimeout cb, 1000 / 60

    requestAnimFrame: (cb) ->
        @_requestAnimFrame.call window, cb

    animate: () ->
        this_time = new Date().getTime()
        if @last_time
            if @anim_count == 100
                @total_anim_time -= @total_anim_time / 100
                @anim_count--
            @total_anim_time += this_time - @last_time
            @anim_count++
        time_elapsed = if @last_time == 0 then 0 else (this_time - @last_time) / 1000
        @last_time = this_time

        @do_zoom()

        @canvas.width = @$canvas.width()
        @canvas.height = @$canvas.height()

        @ctx.clearRect(0, 0, @canvas.width, @canvas.height)

        @ctx.save()
        @ctx.translate(@canvas.width/2,@canvas.height/2)
        #@ctx.strokeRect -200, -200, 400, 400
        @draw @ctx
        @ctx.restore()

        @requestAnimFrame () =>
            @animate()

    start: () ->
        @play()
        @animate()

    play: () ->
        if @state in ["stopped", "paused"]
            @state = "running"
            @engine.start()

    pause: () ->
        if @state == "running"
            @state = "paused"
            @engine.pause()

    stop: () ->
        if @state in ["running", "paused"]
            @state = "stopped"
            @engine.stop()

    restart: () ->
        @stop()
        @play()

    get_adjacent_xy: (x, y, dir) ->
        if dir in [2, 3, 5, 0]
            x += (dir+1)%2 - Math.abs(y+1)%2
        if dir in [5, 0]
            y -= 1
        if dir in [2, 3]
            y += 1
        if dir == 4
            x -= 1
        if dir == 1
            x += 1
        [x, y]

    get_adjacent: (x, y, dir) ->
        [a_x, a_y] = @get_adjacent_xy x, y, dir
        pos = a_x + "," + a_y
        return [a_x, a_y, @objects[pos]]

window.hex = hex
