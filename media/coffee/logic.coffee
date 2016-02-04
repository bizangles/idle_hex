logic = {}

class logic.Base
    constructor: () ->
        @img_ctx = null
        if @img_src?
            @img_loaded = false
            @img = document.createElement('img')
            @img.onload = () =>
                @img_loaded = true
                @draw_img()
            @img.src = @img_src
        @copy_on_drag = false

    draw: (ctx) ->
        @draw_hex ctx
        @draw_logic ctx
        @draw_name ctx

    draw_hex: (ctx) ->
        ctx.save()
        ctx.lineWidth = 1 / 30
        ctx.scale 30, 30
        ctx.beginPath()
        ctx.moveTo 0, -1

        for i in [1..5]
            ctx.rotate Math.PI / 3
            ctx.lineTo 0, -1

        ctx.closePath()
        ctx.stroke()
        ctx.fillStyle = "White"
        ctx.fill()
        ctx.restore()

    draw_logic: (ctx) ->

    draw_name: (ctx) ->
        ctx.save()
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText @name, 0, 0
        ctx.restore()

    draw_img: (ctx) ->
        if not @img_loaded
            @img_ctx = ctx
            return

        if @img_loaded and @img_ctx?
            ctx = @img_ctx
            @img_ctx = null

        if @img_loaded and ctx?
            ratio = @img.height/@img.width
            img_height = 15
            img_width = img_height/ratio
            ctx.drawImage(@img, img_width/-2, img_height/-2, img_width, img_height)

    tick: () ->

    flush: () ->
        @state = @next_state

    draw_lead: (ctx, dir, color) ->
        ctx.save()
        ctx.beginPath()
        ctx.rotate(Math.PI / 6)
        ctx.rotate(dir * Math.PI / 3)
        ctx.arc(0, -20, 5, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()

    draw_circle: (ctx, size, color) ->
        ctx.save()
        ctx.beginPath()
        ctx.arc(0, 0, size, 0, 2*Math.PI)
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()

    is_powered: () ->
        false

    mousedown: (e) ->
        @clicking = true
        @last_drag_pos = [e.pageX, e.pageY]
        false

    mousemove: (e) ->
        t_canv = @t_canv
        dragging = @dragging
        if @clicking and not @dragging
            @clicking = false
            [t_canv, obj] = @put_on_temp_canv(copy=@copy_on_drag)
            obj.dragging = dragging = true
            t_canv.className = "dragging"
            $("#dragging_space")
                .append(t_canv)
                .width('100%').height('100%')
                .mousemove((e) => obj.mousemove(e))

        if dragging == true
            $(t_canv).css('top', e.pageY - t_canv.height/2)
            $(t_canv).css('left', e.pageX - t_canv.width/2)

            grid.move_temp_hex e.pageX, e.pageY

            #[x, y] = grid.get_closest_cell e.pageX, e.pageY
            #grid.move @, x, y

    mouseup: (e) ->
        @clicking = false
        if @dragging
            $(@t_canv).remove()
            @t_canv = null
            @dragging = false
            $("#dragging_space").width('0px').height('0px').unbind('mousemove')
            grid.drop @
        @last_drag_pos = null

    click: (e) ->
        $("#config").html('')
        @config $("#config")

        buttons = $("#config").dialog("option", "buttons");
        buttons[0].click = () => @config_save_wrap($("#config"))
        $("#config").dialog("option", "buttons", buttons)

        $("#config").dialog("open")

    config_save_wrap: (jq_obj) ->
        @config_save jq_obj
        jq_obj.dialog("close")

    config: (jq_obj) ->

    config_save: (jq_obj) ->

    put_on_temp_canv: (copy=false) ->
        if copy
            obj = @copy()
        else
            obj = @

        t_canv = document.createElement('canvas')
        t_canv.width = 70
        t_canv.height = 70
        t_ctx = t_canv.getContext('2d')
        t_ctx.translate(35, 35)

        obj.t_canv = t_canv

        $(t_canv).mousedown((e) => obj.mousedown(e)
        ).mouseup((e) => obj.mouseup(e)
        ).mousemove((e) => obj.mousemove(e))

        obj.draw(t_ctx)
        [t_canv, obj]

    get_args: () ->
        []

    copy: () ->
        type = @.constructor.name
        obj = new logic[type]()
        obj.constructor.apply(obj, @get_args())
        obj

    get_dropdown: () ->
        dropdown = $("<select>")
        for i in [0..5]
            dropdown.append("<option>#{i}</option>")
        dropdown

    reset: () ->


class logic.Blank extends logic.Base
    name: ""
    draw_logic: () ->


class logic.Heat_Source extends logic.Base
    name: "source"

    takes_heat: false

    constructor: (@heat) ->
        @next_state = @state =
            heat: @heat
        super

    get_args: () ->
        [@heat]

    tick: (x, y, grid) ->
        all_adjacent = grid.get_all_adjacent(x, y)
        takes_heat = []
        total_take = 0
        for [a_x, a_y, adj] in all_adjacent
            if adj? and adj.takes_heat and adj.state.heat < @state.heat
                take = (@state.heat - adj.state.heat) / 2
                total_take += take
                takes_heat.push [adj, take]

        take_ratio = Math.min(1, @state.heat / total_take)

        for [adj, take] in takes_heat
            take_amt = take_ratio * take
            @give_heat(adj, take_amt)

    give_heat: (to, heat) ->
        to.take_heat(heat)

class logic.Heat_Sync extends logic.Heat_Source
    name: "sync"

    takes_heat: true

    constructor: (@max_heat) ->
        super(0)

    get_args: () ->
        [@max_heat]

    give_heat: (to, heat) ->
        @next_state =
            heat: @next_state.heat - heat
        super

    take_heat: (heat) ->
        @next_state =
            heat: @next_state.heat + heat

    draw_logic: (ctx) ->
        @draw_circle ctx, Math.max(0, Math.min(@state.heat / @max_heat * 25, 25)), "#FDD"


class logic.Power_Gen extends logic.Heat_Sync
    name: "gen"

    take_heat: (heat) ->
        @next_state =
            heat: @next_state.heat + heat

    flush: () ->
        @next_state.heat = Math.max(0, @next_state.heat - @max_heat)
        super


class logic.Binary_Gate extends logic.Base
    constructor: (@in1, @in2, @out) ->
        @next_state = @state =
            in1: false
            in2: false
            out: false
        super

    get_args: () ->
        [@in1, @in2, @out]

    tick: (x, y, grid) ->
        [a1_x, a1_y, a1] = grid.get_adjacent(x, y, @in1)
        [a2_x, a2_y, a2] = grid.get_adjacent(x, y, @in2)

        in1 = a1? and a1.is_powered((@in1 + 3) % 6)
        in2 = a2? and a2.is_powered((@in2 + 3) % 6)

        out = @tick_logic in1, in2

        @next_state =
            in1: in1
            in2: in2
            out: out

    draw_logic: (ctx) ->
        @draw_img ctx
        @draw_lead ctx, @in1, if @state.in1 then "Green" else "Red"
        @draw_lead ctx, @in2, if @state.in2 then "Green" else "Red"
        @draw_lead ctx, @out, if @state.out then "Green" else "Red"

    draw_name: () ->

    is_powered: (dir) ->
        if dir == @out
            return @state.out
        false

    config: (jq_obj) ->
        jq_obj.append(@get_dropdown().val(@in1))
        jq_obj.append(@get_dropdown().val(@in2))
        jq_obj.append(@get_dropdown().val(@out))

    config_save: (jq_obj) ->
        vals = []
        jq_obj.find("select").each (i,o)->
            vals.push(parseInt o.value)
        [@in1, @in2, @out] = vals


class logic.And extends logic.Binary_Gate
    name: "and"
    img_src: "media/img/AND_ANSI.svg"

    tick_logic: (in1, in2) ->
        in1 and in2


class logic.Nor extends logic.Binary_Gate
    name: "and"
    img_src: "media/img/NOR_ANSI.svg"

    tick_logic: (in1, in2) ->
        not (in1 or in2)


class logic.Nand extends logic.Binary_Gate
    name: "and"
    img_src: "media/img/NAND_ANSI.svg"

    tick_logic: (in1, in2) ->
        not (in1 and in2)


class logic.Pulse extends logic.Base
    name: "pulse"

    constructor: (@rate) ->
        @reset()

    reset: () ->
        @ticks_left = @rate
        @next_state = @state =
            power: false

    get_args: () ->
        [@rate]

    tick: () ->
        @ticks_left--

        if @ticks_left <= 0
            @next_state =
                power: !@state.power
            @ticks_left = @rate

    draw_logic: (ctx) ->
        if @state.power
            ctx.save()
            ctx.beginPath()
            ctx.arc(0, 0, 25, 0, 2*Math.PI)
            ctx.fillStyle = "FDD"
            ctx.fill()
            ctx.restore()

    is_powered: (dir) ->
        @state.power

    config: (jq_obj) ->
        jq_obj.append("<input value=\"#{@rate}\">")

    config_save: (jq_obj) ->
        @rate = jq_obj.find("input").val()


class logic.LED extends logic.Base
    name: "led"

    constructor: () ->
        @next_state = @state =
            power: false

    draw_logic: (ctx) ->
        if @state.power
            ctx.save()
            ctx.beginPath()
            ctx.arc(0, 0, 20, 0, 2*Math.PI)
            ctx.fillStyle = "FDD"
            ctx.fill()
            ctx.restore()

    tick: (x, y, grid) ->
        powered = false
        for l in [0..5]
            [a_x, a_y, a] = grid.get_adjacent(x, y, l)
            if a? and a.is_powered((l + 3) % 6)
                powered = true
                break
        @next_state =
            power: powered


class logic.Wire extends logic.Base
    name: "wire"
    instant: true

    constructor: (@wires) ->
        @updated = [false, false, false]
        @state =
            power: [false, false, false]

    get_args: () ->
        [@wires]

    config: (jq_obj) ->
        for wire in @wires
            wire_div = $("<div>")
            for i in [0..5]
                wire_div.append($("<input label=\"#{i}\" type=\"checkbox\"#{if i in wire then " checked" else ""}>"))
            jq_obj.append wire_div

    config_save: (jq_obj) ->
        wires = []
        jq_obj.find("div").each (w, wire_div) =>
            wire = []
            $(wire_div).find("input[type=checkbox]").each (i, inp) =>
                if inp.checked
                    wire.push i
            wires.push wire
        @wires = wires


    tick: (x, y, grid) ->
        for w in [0..2]
            if @updated[w]
                continue
            wire = @wires[w]
            @updated[w] = true
            @state.power[w] = false
            delayed = []
            for l in wire
                [a_x, a_y, a] = grid.get_adjacent(x, y, l)
                if a?
                    if a.instant and !a.is_updated (l + 3) % 6
                        delayed.push [l, a_x, a_y, a]
                        continue
                    if a.is_powered (l + 3) % 6
                        @state.power[w] = true
                        break
            for [l, a_x, a_y, a] in delayed
                a.tick a_x, a_y, grid
                if a.is_powered (l + 3) % 6
                    @state.power[w] = true

    flush: () ->
        @updated = [false, false, false]

    is_updated: (dir) ->
        if not dir?
            return not (false in @updated)

        for w in [0..2]
            wire = @wires[w]
            if dir in wire
                return @updated[w]

    is_powered: (dir) ->
        for w in [0..2]
            wire = @wires[w]
            if dir in wire
                return @state.power[w]

    draw_logic: (ctx) ->
        for w in [0..2]
            wire = @wires[w]
            if wire.length == 0
                continue
            color = if @state.power[w] then "Green" else "Red"
            ctx.save()
            ctx.beginPath()
            ctx.rotate(Math.PI / 6)
            ctx.moveTo 0, 0
            for l in [0..wire.length-1]
                ctx.save()
                ctx.rotate(wire[l] * Math.PI / 3)
                ctx.lineTo 0, -25
                ctx.lineTo 0, 0
                ###
                if l == 0
                    ctx.moveTo(0,-25)
                else
                    #ctx.bezierCurveTo(0,0,0,0,0,-25)
                    ctx.quadraticCurveTo(0,0,0,-25)
                ###
                ctx.restore()
            ctx.lineWidth = 5
            ctx.strokeStyle = "Black"
            ctx.stroke()
            ctx.lineWidth = 4
            ctx.strokeStyle = color
            ctx.stroke()
            ctx.restore()

class logic.Delay extends logic.Base
    name: "delay"

    constructor: (@in, @out) ->
        @next_state = @state =
            power: false

    get_args: () ->
        [@in, @out]

    tick: (x, y, grid) ->
        powered = false
        [a_x, a_y, a] = grid.get_adjacent x, y, @in
        if a? and a.is_powered (@in + 3) % 6
            powered = true
        @next_state =
            power: powered

    is_powered: (dir) ->
        if dir == @out
            return @state.power
        false

    draw_logic: (ctx) ->
        @draw_lead ctx, @in, if @state.power then "Green" else "Red"
        @draw_lead ctx, @out, if @state.power then "Green" else "Red"

    config: (jq_obj) ->
        jq_obj.append(@get_dropdown().val(@in))
        jq_obj.append(@get_dropdown().val(@out))

    config_save: (jq_obj) ->
        vals = []
        jq_obj.find("select").each (i,o)->
            vals.push(parseInt o.value)
        
        [@in, @out] = vals

class logic.Switch extends logic.Base
    name: "switch"

    constructor: () ->
        @state =
            power: false

    is_powered: (dir) ->
        @state.power

    draw_logic: (ctx) ->
        if @state.power
            ctx.save()
            ctx.beginPath()
            ctx.arc(0, 0, 25, 0, 2*Math.PI)
            ctx.fillStyle = "FDD"
            ctx.fill()
            ctx.restore()

    flush: () ->

    click: () ->
        @state.power = not @state.power
        

window.logic = logic
