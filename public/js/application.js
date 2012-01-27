var current_fullpath = [],
    current_commit_from_head = 0;

function highlight_code() {
	$('pre code').each(function(i, e) {
    hljs.highlightBlock(e, '    ') // replace TAB by 4 blankspaces
  });
}

function request_history_of_file(filename) {
  if(filename != undefined)
    current_fullpath.push(filename);

  jQuery.get('/history/'+btoa(current_fullpath.join('/')), {commit_from_head: current_commit_from_head}, function(response){ 
    jQuery('.tree_container').html(response);
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
