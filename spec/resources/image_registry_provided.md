#Text

![first image](first.jpg)

![second image](second.jpg)

# Figures

{% for picture in book.pictures %}
[{{ picture.list_caption }}]({{ picture.backlink }})
{% endfor %}

# Footnote