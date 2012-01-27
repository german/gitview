module GitBrowser
  class Visitor
    attr_accessor :data_arr
    
    def initialize(file_or_dir)
      @file_or_dir = file_or_dir
      @parts = @file_or_dir.split('/')
      @data_arr = []
      @level = 0
      @dir_level = 0
    end
        
    def visit(commit, tree)
      tree.contents.each do |content|
        puts "content.name, @file_parts[#{@level}] - " + content.name.to_s + ', ' + @parts[@level].inspect
        break if @parts[@level].nil?
        if content.name == @parts[@level] && content.class == Grit::Blob
          puts 'pushing to @data_arr'
          @data_arr << {:code => content.data, :date => commit.committed_date, :committer => commit.committer} # :a_blob => commit.diffs[].a_blob.data, :b_blob => commit.diffs[].b_blob.data, 
          @level = 0
          break
        elsif content.name == @parts[@level] && content.class == Grit::Tree
          puts '#reentering visit with content.name ' + content.name.inspect
          @level += 1
          visit(commit, content)
        end
      end
    end    
  end
end
