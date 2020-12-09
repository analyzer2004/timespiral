# Time Spiral

Spiral chart visualizes time-based dataset alone an outward spiral. It is beneficial for displaying a large dataset over a long period in a single visualization. Color can be based on values to emphasize the chart's visual aspect or assigned to each period, which helps as a way of observing periodic patterns.

For live demos and sample codes, please see [Time Spiral](https://observablehq.com/@analyzer2004/timespiral)

<img src="https://github.com/analyzer2004/timespiral/blob/master/images/cover.png" width="768">

## API Reference
* **TimeSpiral(container)** - Constructs a new instance of TimeSpiral with default settings. The container can be an svg or g ekement.
* **size([width, height])** - Sets the dimensions to specified width and height and returns this chart.
* **innerRadius(radius)** - Sets the radius where the spiral starts and return this chart.
* **style(style)** - Overrides the default style and return this chart.
  * style.**align** - specifies the alignment of bars.
    * center - places bars on the center of the spiral axis
    * base - places bars on top of the spiral axis
  * style.**barWidth** - specifies the width style of bars.
    * skinny - half width
    * normal - full width
  * style.**rounded** - specifies whether the edges of the bars are rounded.
  * style.**colorBy** - specifies how the colors are assigned.
    * value - colors are based on values
    * time - colors are assigned to each period
  * style.**tickInterval** - specifies the tick interval.
    * auto 
    * monthly
  * style.**showTicks** - whether to show tick marks on the spiral axis.
  * style.**tickColor** - the color of tick marks.
  * style.**tickSize** - the font size of tick marks.
  * style.**titleFormat** - the number format of tooltip.
  * style.**reverseColor** - sepcifies whether the color is reversed
* **palette(palette)** - Sets the color palette of bars to a continuous interpolator *(color by value)* or a categorical scheme *(color by time)* and returns this chart. Default is d3.interpolateYlGnBu.
* **field(field)** - Sets the field names for reading chart data and returns this chart.
  * field.**date** - the field name of date.
  * field.**value** - the field name of value.
* **data(data)** - sets the data and returns this chart.
* **render()** - Renders the chart and returns this instance.