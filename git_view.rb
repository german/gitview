require 'rubygems'
require 'grit'
require 'sinatra/base'
require 'base64'
require 'json'

require_relative './models/visitor.rb'

class GitView < Sinatra::Base
  use Rack::Session::Pool, :expire_after => 2592000

  @current_page = 0

  post '/get_repo' do
    repo_url = Base64.decode64(params[:repo_url])
    session[:last_repo_url] = repo_url

    if repo_url =~ /^git:\/\/|git@|https?:\/\//
      repo_parts = repo_url.split('/')
      repo_name = repo_parts.pop.gsub(/\.git/,'')
      username = repo_parts.pop

      full_repo_name = "/var/www/gitview_repos/#{username}/#{repo_name}"

      if !File.exists?(full_repo_name)
        output = `mkdir -p /var/www/gitview_repos/#{username} && cd /var/www/gitview_repos/#{username} && git clone #{repo_url} 2>&1`
        if output =~ /fatal: remote error:(.*)/mi
          halt $1.to_s
        end
      end
    else
      full_repo_name = repo_url
    end

    begin
      #$repo = Grit::Repo.new('/Users/german/projects/ruby/repo')
      $repo = Grit::Repo.new(full_repo_name)
    rescue Grit::NoSuchPathError => e
      puts e.message
      halt $1.to_s
    end
    redirect to('/tree')
  end

  get '/' do
    @last_repo_url = session[:last_repo_url] || ''
    erb :index
  end

  get '/history/:encoded_filename' do
    filename = Base64.decode64(params[:encoded_filename])
    commit_from_head = params[:commit_from_head].to_i
    
    puts 'filename - ' + filename.inspect
    if !$repo.commits('master', 500).empty?
      @visitor = GitBrowser::Visitor.new(filename)
      $repo.commits('master', 500).each_with_index do |commit, index|
        next if ! commit.stats.files.flatten.reject{|part| part.is_a?(Integer)}.include?(filename)
        puts 'commit #'+index.to_s
        @visitor.visit(commit, commit.tree)
      end
    end
    puts "get all commit data! #{@visitor.data_arr.size} different commits"
    @page = 0
    @code = @visitor.data_arr[commit_from_head][:code]
    @date = @visitor.data_arr[commit_from_head][:date]
    @committer = @visitor.data_arr[commit_from_head][:committer]
    #erb :history
    content_type :json
    {:committer => @committer, :code => @code, :number_of_commits => @visitor.data_arr.length, :commits => @visitor.data_arr.map{|c| c[:date].to_s} }.to_json
  end

  get '/tree' do
    @page = 0
    @tree = $repo.commits.last.tree
    erb :tree
  end

  get '/show_tree/:encoded_path' do
    path = Base64.decode64(params[:encoded_path])
    @tree = contents_in_dir($repo.commits.last.tree, path)
    erb :_tree
  end
=begin
  get '/file/:filename/:page' do
    @page = params[:page].to_i
    @filename = Base64.decode64 params[:filename] #'app/controllers/locals_controller.rb'
    parse_tree(@filename)
    
    @code = @visitor.data_arr[@page][:code]
    @date = @visitor.data_arr[@page][:date]
    @committer = @visitor.data_arr[@page][:committer]
    erb :index
  end
=end
  private

  # only works with fullpath like 'app/view/users' or 'config/initializers'
  def contents_in_dir(current_tree, fullpath)
    contents_in_dir_at_level(current_tree, fullpath, 0)
  end

  def contents_in_dir_at_level(current_tree, fullpath, level)
    content_names = current_tree.contents.collect{|c| c.name}
    deeper_tree = current_tree.contents.detect{|content| content.name == fullpath.split('/')[level] && content.class == Grit::Tree}
    if content_names.include?(fullpath.split('/')[level]) && (fullpath.split('/').length == (level+1))
      return deeper_tree
    else
      contents_in_dir_at_level(deeper_tree, fullpath, level + 1)
    end
  end
end
