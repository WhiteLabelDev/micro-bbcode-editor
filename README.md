Micro BBCode Editor
===================

What is BBCode?
[See Wikipedia](https://en.wikipedia.org/wiki/BBCode)


What is Micro BBCode Editor?
* Client-side JavaScript parser
* Works on most browsers (IE7+)
* Lightweight 8Kb, no jQuery needed
* Renders BBCode in real-time
* Helpful error hints on invalid input
* Specify the tags you want to support
* Has optional keyboard shortcuts
* Has optional pre-selected text range
* Easily extensible, errors can be suppressed
* Guaranteed to generate valid HTML markup


How to use
----------

```
<!-- Include the library -->
<script type="text/javascript" src="micro_bbcode_editor.js" defer="defer"></script>

<!-- Create an input source -->
<textarea
  id="micro_bbcode_editor_doc"
  data-bbtags="b,i,u,s,color"
  data-bbpreselection="289,296"
  data-bbshortcuts="true">
Lorem [b]ipsum[b] dolor [i]sit[/i] amet</textarea>

<!-- Create an output preview -->
<div id="micro_bbcode_editor_preview"></div>
```

Outputs: Lorem **ipsum** dolor *sit* amet

Where `data-bbtags` is supported BBCode tags, `data-bbpreselection` is pre-selected text index range, and `data-bbshortcuts` is whether to map Ctrl+? keys for tag shortcuts.  All are optional.

Preview
-------
See a live demo: https://whitelabeldev.github.io/micro-bbcode-editor/


Licensed under MPL2 (plays nicely with both copyleft and commercial licenses)
