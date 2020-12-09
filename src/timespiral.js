// https://github.com/analyzer2004/timespiral
// Copyright 2020 Eric Lo
class TimeSpiral {
    constructor(container) {
        this._container = container;
        this._g = null;

        this._width = 800;
        this._height = 600;

        this._innerRadius = 50;
        this._maxRadius = 0;
        this._layers = 5;
        this._precision = 32;
        this._layerHeight = 0;
        this._charBox = null;

        this._style = {
            align: "base",
            barWidth: "skinny",
            rounded: true,
            colorBy: "value",
            tickInterval: "monthly",
            showTicks: true,
            tickColor: "#999",
            tickSize: "8pt",
            titleFormat: ",.0d",
            reverseColor: false
        };
        this._centered = true;
        this._skinny = true;

        this._palette = d3.interpolateYlGnBu;

        this._data = null;
        this._min = 0;
        this._max = 0;
        this._firstDay = null;
        this._lastDay = null;
        this._chartData = null;
        this._field = {
            date: "date",
            value: "value"
        };

        this._time = null;
        this._size = null;
        this._color = null;
        this._spiral = null;
        this._offsets = null;

        this._spiralLength = 0;
        this._barWidth = 0;

        this._bars = null;
        this._ticks = null;
    }

    size(_) {
        return arguments.length ? (this._width = _[0], this._height = _[1], this) : [this._width, this._height];
    }

    innerRadius(_) {
        return arguments.length ? (this._innerRadius = _, this) : this._innerRadius;
    }

    layers(_) {
        return arguments.length ? (this._layers = _, this) : this._layers;
    }

    style(_) {
        return arguments.length ? (this._style = Object.assign(this._style, _), this) : this._style;
    }

    palette(_) {
        return arguments.length ? (this._palette = _, this) : this._palette;
    }

    field(_) {
        return arguments.length ? (this._field = Object.assign(this._field, _), this) : this._field;
    }

    data(_) {
        return arguments.length ? (this._data = _, this) : this._field;
    }

    render() {
        this._init();
        this._renderSpiral();
        this._process();
        this._initScales();

        this._calculateBars();
        this._renderBars();
        if (this._style.showTicks) this._renderAxis();
    }

    _init() {
        this._getCharBox();

        var max = (this._width < this._height ? this._width : this._height) / 2;
        this._layerHeight = (max - this._innerRadius) / (this._layers + 1) - this._charBox.height;
        this._maxRadius = max - this._layerHeight;
        this._centered = this._style.align === "center";
        this._skinny = this._style.barWidth === "skinny";
    }

    _getCharBox() {
        var text;
        try {
            text = this._container.append("text")
                .attr("font-size", this._style.tickSize)
                .text("M");
            this._charBox = text.node().getBBox();
        }
        finally {
            if (text) text.remove();
        }
    }

    _process() {
        const ext = d3.extent(this._data.map(d => d[this._field.value]));
        this._min = ext[0];
        this._max = ext[1];

        this._firstDay = this._data[0][this._field.date];
        this._lastDay = this._data[this._data.length - 1][this._field.date];

        this._spiralLength = this._spiral.node().getTotalLength();
        this._barWidth = this._spiralLength / this._data.length / (this._skinny ? 2 : 1);
    }

    _calculateBars() {
        const bars = this._data.map(d => {
            const
                date = d[this._field.date],
                value = d[this._field.value],
                size = this._size(value),
                t = this._time(date),
                p1 = this._spiral.node().getPointAtLength(t),
                p2 = this._spiral.node().getPointAtLength(t - this._barWidth);

            return {
                date: date,
                day: date.getDate(),
                value: value,
                t: t,
                x: p1.x,
                y: this._centered ? p1.y - size / 2 : p1.y,
                y0: p1.y,
                yr: p1.y, // rotate y
                offset: 0, // tick text offset
                size: size,
                angle: Math.atan2(p2.y, p2.x) * 180 / Math.PI - 90
            };
        });

        this._offsets = [];
        if (this._centered) {
            bars.forEach((d, i) => {
                if (d.day === 1) {
                    const sample = [];
                    for (let j = i; j < i + 5 && j < bars.length; j++) {
                        sample.push(bars[j].size);
                    }

                    this._offsets.push({
                        t: d.t,
                        height: d3.max(sample)
                    })
                }
            });
        }

        this._bars = bars;
    }

    _initScales() {
        this._initColors();

        this._time = d3.scaleTime()
            .domain([this._firstDay, this._lastDay])
            .range([0, this._spiralLength]);

        this._size = d3.scaleLinear()
            .domain([this._min, this._max]).nice()
            .range([5, this._layerHeight]);
    }

    _initColors() {
        const style = this._style;
        if (style.colorBy === "time") {
            const months = d3.timeMonth
                .every(1)
                .range(this._firstDay, this._lastDay);

            this._color = d3.scaleOrdinal()
                .domain(months.map(d => d.getFullYear() + "." + d.getMonth()))
                .range(this._palette);
        }
        else {
            this._color = d3
                .scaleSequential(this._palette)
                .domain(style.reverseColor ? [this._max, this._min] : [this._min, this._max]);
        }
    }

    _renderSpiral() {
        this._g = this._container.append("g")
            .attr("transform", `translate(${this._width / 2},${this._height / 2})`);

        this._spiral = this._g.append("path")
            .attr("id", "axis")
            .attr("fill", "none")
            .attr("stroke", "none")
            .attr("stroke-width", 0.5)
            .attr("d", this._axisSpiral(this._precision * 2 * this._layers + 1));
    }

    _axisSpiral(length) {
        return d3.lineRadial()
            .angle((d, i) => Math.PI / this._precision * i)
            .radius((d, i) => i * (this._maxRadius - this._innerRadius) / length + this._innerRadius)({ length });
    }

    _renderBars() {
        const w = this._barWidth, hw = w / 2;

        var color;
        if (this._style.colorBy === "value")
            color = d => this._color(d.value);
        else
            color = d => {
                const key = d.date.getFullYear() + "." + d.date.getMonth();
                return this._color(key);
            };

        const bars = this._g.selectAll(".bar")
            .data(this._bars)
            .join("rect")
            .attr("class", "bar")
            .attr("fill", color)
            .attr("opacity", 1)
            .attr("x", d => d.x).attr("y", d => d.y)
            .attr("width", w).attr("height", d => d.size)
            .attr("transform", d => `rotate(${d.angle},${d.x},${d.yr})`)
            .on("mouseover", (e, d) => {
                bars.transition().duration(250).attr("opacity", _ => _ === d ? 1 : 0.5);
            })
            .on("mouseout", (e, d) => {
                bars.transition().duration(250).attr("opacity", 1);
            });

        if (this._style.rounded) bars.attr("rx", hw).attr("ry", hw);

        bars.append("title")
            .text(d => {
                const date = `${d.date.getFullYear()}-${d.date.getMonth() + 1}-${d.date.getDate()}`;
                const value = d3.format(this._style.titleFormat)(d.value);
                return `${date}\n${value}`;
            });
    }

    _renderAxis() {
        const
            style = this._style,
            w = this._barWidth, hw = w / 2, wh = w + hw,
            offset = this._skinny ? wh : hw;

        var ticks;
        if (style.tickInterval === "monthly")
            ticks = d3.timeMonth.every(1).range(this._firstDay, this._lastDay);
        else
            ticks = this._time.ticks();

        const data = ticks.map(d => {
            const t = this._time(d);
            const bar = this._bars.find(_ => _.t === t);
            if (bar && this._centered) {
                const offset = this._offsets.find(_ => _.t === t);
                bar.offset = (offset ? offset.height : this._layerHeight) / 2 + w;
            }
            return bar;
        });

        const lineOffset = this._centered ? 0 : this._charBox.height;
        this._ticks = this._g.selectAll(".tick")
            .data(data)
            .join("g")
            .attr("class", "tick")
            .attr("fill", style.tickColor)
            .attr("font-size", style.tickSize)
            .call(g => g.append("line")
                .attr("stroke", style.tickColor)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "1,1")
                .attr("x1", d => d.x + offset).attr("y1", d => d.y0 + hw)
                .attr("x2", d => d.x + offset).attr("y2", d => d.y0 - d.offset - lineOffset)
                .attr("transform", d => `rotate(${d.angle},${d.x},${d.y0})`));

        this._ticks
            .append("text")
            .attr("dy", this._centered ? w : "1em")
            .attr("x", d => d.x - offset + 3).attr("y", d => d.y0 + d.offset)
            .attr("transform", d => `rotate(${d.angle + 180},${d.x},${d.y0})`)
            .text(d => `${d.date.getFullYear()}-${d.date.getMonth() + 1}`);
    }
}