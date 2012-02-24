var current_fullpath = [],
    current_commit_from_head = 0;

function highlight_code() {
	$('pre code').each(function(i, e) {
    hljs.highlightBlock(e, '    ') // replace TAB by 4 blankspaces
  });
}

function request_history_of_file(filename) {
  if(filename != undefined) {
    current_fullpath.push(filename);
  }

  jQuery.getJSON('/history/'+btoa(current_fullpath.join('/')), {commit_from_head: current_commit_from_head}, function(response){
    // slider

    //jQuery.map(response['commits'], function(date) {
    //  jQuery('.scroll-content').append('<div class="scroll-content-item ui-widget-header">' + date + '</div>')
    //});
    //set_slider();

    jQuery('.tree_container').html("<pre><code></code></pre>");
    jQuery('.tree_container pre code').text(response['code']);

    //jQuery('.commit_info').html("Committed date: "+response['date']+". By: "+response['committer']);
    jQuery('.nav').html('<a href="javascript:void(0)" onclick="current_commit_from_head++;request_history_of_file()">Prev</a>');
    highlight_code();
  });
  highlight_code();
}

function request_tree_for(filename) {
  current_fullpath.push(filename);
  jQuery.get('/show_tree/'+btoa(current_fullpath.join('/')), function(response){ 
    jQuery('.tree_container').html(response);
  })
}

function set_slider() {
  //scrollpane parts
  var scrollPane = $( ".scroll-pane" ),
		scrollContent = $( ".scroll-content" );
		
	//build slider
	var scrollbar = $( ".scroll-bar" ).slider({
		slide: function( event, ui ) {
			if ( scrollContent.width() > scrollPane.width() ) {
				scrollContent.css( "margin-left", Math.round(
					ui.value / 100 * ( scrollPane.width() - scrollContent.width() )
				) + "px" );
			} else {
				scrollContent.css( "margin-left", 0 );
			}
		}
	});
		
	//append icon to handle
	var handleHelper = scrollbar.find( ".ui-slider-handle" ).mousedown(function() {
		scrollbar.width( handleHelper.width() );
	})
	.mouseup(function() {
		scrollbar.width( "100%" );
	})
	.append( "<span class='ui-icon ui-icon-grip-dotted-vertical'></span>" )
	.wrap( "<div class='ui-handle-helper-parent'></div>" ).parent();
		
	//change overflow to hidden now that slider handles the scrolling
	scrollPane.css( "overflow", "hidden" );
		
	//size scrollbar and handle proportionally to scroll distance
	function sizeScrollbar() {
		var remainder = scrollContent.width() - scrollPane.width();
		var proportion = remainder / scrollContent.width();
		var handleSize = scrollPane.width() - ( proportion * scrollPane.width() );
		scrollbar.find( ".ui-slider-handle" ).css({
			width: handleSize,
			"margin-left": -handleSize / 2
		});
		handleHelper.width( "" ).width( scrollbar.width() - handleSize );
	}
		
	//reset slider value based on scroll content position
	function resetValue() {
		var remainder = scrollPane.width() - scrollContent.width();
		var leftVal = scrollContent.css( "margin-left" ) === "auto" ? 0 :
			parseInt( scrollContent.css( "margin-left" ) );
		var percentage = Math.round( leftVal / remainder * 100 );
		scrollbar.slider( "value", percentage );
	}
		
	//if the slider is 100% and window gets larger, reveal content
	function reflowContent() {
		var showing = scrollContent.width() + parseInt( scrollContent.css( "margin-left" ), 10 );
		var gap = scrollPane.width() - showing;
			if ( gap > 0 ) {
				scrollContent.css( "margin-left", parseInt( scrollContent.css( "margin-left" ), 10 ) + gap );
			}
	}
		
	//change handle position on window resize
	$( window ).resize(function() {
		resetValue();
		sizeScrollbar();
		reflowContent();
	});

	//init scrollbar size
	setTimeout( sizeScrollbar, 10 );//safari wants a timeout
}
