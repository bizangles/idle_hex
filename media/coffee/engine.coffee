engine = {}


class engine.Engine
    constructor: (@grid) ->
        @last_tick = 0
        @total_tick_time = 0
        @tick_count = 0
        @state = "stopped"

    start: () ->
        @state = "running"
        @tick()

    pause: () ->
        @state = "paused"

    stop: () ->
        @state = "stopped"

    reset: () ->
        @last_tick = 0
        @total_tick_time = 0
        @tick_count = 0

        if @state in ["stopped"]
            for [x, y, o] in @grid.iter_obj()
                o.reset()

    tick: () ->
        if @state in ["paused", "stopped"]
            @reset()
            return

        tick_time = new Date().getTime()
        if @last_tick
            if @tick_count == 100
                @total_tick_time -= @total_tick_time / 100
                @tick_count--
            @total_tick_time += tick_time - @last_tick
            @tick_count++
        @last_tick = tick_time

        not_delayed = []
        delayed = []
        for [x, y, o] in @grid.iter_obj()
            if o.instant
                delayed.push([x, y, o])
                continue
            o.tick(x, y, @grid)
            not_delayed.push o

        for o in not_delayed
            o.flush()

        for [x, y, o] in delayed
            if !o.is_updated()
                o.tick x, y, @grid

        for [x, y, o] in delayed
            o.flush()

        @next_tick()

    next_tick: () ->
        goal_tps = 10
        next_tick = new Date().getTime() - @last_tick + (1000 / goal_tps)
        if @tick_count == 100
            next_tick = Math.round(next_tick + ((next_tick * @tick_count) - (@total_tick_time)))

        setTimeout () =>
            @tick()
        , next_tick

    add: (obj) ->
        @objects.push obj

    draw: (ctx) ->
        ctx.save()
        ctx.translate(ctx.canvas.width/-2, ctx.canvas.height/-2)
        ctx.fillText("TPS: " + (@tick_count/(@total_tick_time/1000)).toFixed(2), 10, 10)
        ctx.restore()
    
    animate: () -> 


window.engine = engine
